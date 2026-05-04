/**
 * Merkle root of the verified entity directory.
 * Computed at build time from packages/directory/data/entities.json.
 *
 * SHA-256 over canonical JSON (entities sorted by ID), then pair-hashing
 * up the Merkle tree to a single 64-character hex root.
 *
 * Published to rapidcheck.ro/_merkleroot.json for runtime verification.
 */
export const MERKLE_ROOT = "1d5220de9813e4b20c7f7131619da05742b0cda3376e3f0820c5d82455af5f2e" as const;
