import { MERKLE_ROOT } from '@rapidcheck/core';
import { verifiedDirectorySchema, type VerifiedDirectory } from '@rapidcheck/directory';

const REMOTE_DIRECTORY_URL =
  'https://raw.githubusercontent.com/danieltamas/rapidcheck.ro/main/packages/directory/data/entities.json';
const REMOTE_ROOT_URL =
  'https://raw.githubusercontent.com/danieltamas/rapidcheck.ro/main/_merkleroot.json';
const CACHE_KEY = 'rapidcheck.remoteDirectory.v1';
const MAX_CACHE_AGE_MS = 6 * 60 * 60 * 1000;

interface RemoteRootFile {
  version: string;
  merkleRoot: string;
  generatedAt: string;
  entityCount: number;
}

interface CachedDirectory {
  directory: VerifiedDirectory;
  merkleRoot: string;
  fetchedAt: number;
}

export interface DirectoryUpdateState {
  directory: VerifiedDirectory;
  source: 'bundled' | 'remote-cache' | 'remote-live';
  merkleRoot: string;
  remoteMerkleRoot?: string;
  updatedAt?: string;
}

let refreshPromise: Promise<DirectoryUpdateState | null> | null = null;

export async function loadRemoteDirectory(): Promise<DirectoryUpdateState | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = loadRemoteDirectoryInner().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

async function loadRemoteDirectoryInner(): Promise<DirectoryUpdateState | null> {
  const cached = await readCachedDirectory();
  if (cached && Date.now() - cached.fetchedAt < MAX_CACHE_AGE_MS) {
    return {
      directory: cached.directory,
      source: 'remote-cache',
      merkleRoot: cached.merkleRoot,
      updatedAt: cached.directory.updatedAt,
    };
  }

  const remoteRoot = await fetchRemoteRoot();
  if (!remoteRoot) return cached ? cachedState(cached) : null;

  const remoteDirectory = await fetchRemoteDirectory();
  if (!remoteDirectory) return cached ? cachedState(cached, remoteRoot.merkleRoot) : null;

  const computedRoot = await computeDirectoryMerkleRoot(remoteDirectory);
  if (computedRoot !== remoteRoot.merkleRoot) {
    return cached ? cachedState(cached, remoteRoot.merkleRoot) : null;
  }

  const next: CachedDirectory = {
    directory: remoteDirectory,
    merkleRoot: computedRoot,
    fetchedAt: Date.now(),
  };
  await writeCachedDirectory(next);

  return {
    directory: remoteDirectory,
    source: 'remote-live',
    merkleRoot: computedRoot,
    remoteMerkleRoot: remoteRoot.merkleRoot,
    updatedAt: remoteDirectory.updatedAt,
  };
}

function cachedState(cached: CachedDirectory, remoteMerkleRoot?: string): DirectoryUpdateState {
  return {
    directory: cached.directory,
    source: 'remote-cache',
    merkleRoot: cached.merkleRoot,
    remoteMerkleRoot,
    updatedAt: cached.directory.updatedAt,
  };
}

async function fetchRemoteRoot(): Promise<RemoteRootFile | null> {
  const raw = await fetchJson(REMOTE_ROOT_URL);
  if (!isObject(raw)) return null;
  const merkleRoot = typeof raw['merkleRoot'] === 'string' ? raw['merkleRoot'] : '';
  if (!/^[a-f0-9]{64}$/.test(merkleRoot)) return null;
  return {
    version: typeof raw['version'] === 'string' ? raw['version'] : '',
    merkleRoot,
    generatedAt: typeof raw['generatedAt'] === 'string' ? raw['generatedAt'] : '',
    entityCount: typeof raw['entityCount'] === 'number' ? raw['entityCount'] : 0,
  };
}

async function fetchRemoteDirectory(): Promise<VerifiedDirectory | null> {
  const raw = await fetchJson(REMOTE_DIRECTORY_URL);
  const parsed = verifiedDirectorySchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

async function fetchJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function readCachedDirectory(): Promise<CachedDirectory | null> {
  try {
    const out = await chrome.storage.local.get([CACHE_KEY]);
    const value = out[CACHE_KEY];
    if (!isObject(value)) return null;
    const merkleRoot = typeof value['merkleRoot'] === 'string' ? value['merkleRoot'] : '';
    const fetchedAt = typeof value['fetchedAt'] === 'number' ? value['fetchedAt'] : 0;
    const directory = verifiedDirectorySchema.safeParse(value['directory']);
    if (!directory.success || !/^[a-f0-9]{64}$/.test(merkleRoot) || fetchedAt <= 0) return null;
    return { directory: directory.data, merkleRoot, fetchedAt };
  } catch {
    return null;
  }
}

async function writeCachedDirectory(next: CachedDirectory): Promise<void> {
  try {
    await chrome.storage.local.set({ [CACHE_KEY]: next });
  } catch {
    // Storage failures should never break domain verification; bundled data
    // remains the fallback.
  }
}

export async function computeDirectoryMerkleRoot(directory: VerifiedDirectory): Promise<string> {
  const entities = [...directory.entities].sort((a, b) => a.id.localeCompare(b.id));
  const hashes = await Promise.all(entities.map((entity) => sha256Hex(JSON.stringify(entity))));
  return merkleRoot(hashes);
}

async function merkleRoot(hashes: string[]): Promise<string> {
  if (hashes.length === 0) return sha256Hex('');
  if (hashes.length === 1) return hashes[0]!;
  const next: string[] = [];
  for (let i = 0; i < hashes.length; i += 2) {
    const left = hashes[i]!;
    const right = hashes[i + 1] ?? left;
    next.push(await sha256Hex(left + right));
  }
  return merkleRoot(next);
}

async function sha256Hex(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export const BUNDLED_MERKLE_ROOT = MERKLE_ROOT;
