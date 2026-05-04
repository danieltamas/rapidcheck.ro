/**
 * Cross-context message contract — Path C.
 *
 * Popup/content ask the background worker for domain status and bundled
 * directory searches. Keeping directory search in the SW prevents the popup
 * from parsing the full directory on open.
 */

import type { DomainStatus } from '@rapidcheck/core';
import type { VerifiedEntitySummary } from '@rapidcheck/directory';

export interface GetStatusRequest {
  type: 'get-status';
  url?: string;
}

export interface GetStatusReply {
  type: 'get-status:reply';
  status: DomainStatus | null;
  hostname?: string | null;
  entity?: VerifiedEntitySummary | null;
}

export interface SearchEntitiesRequest {
  type: 'search-entities';
  query: string;
  limit?: number;
}

export interface SearchEntitiesReply {
  type: 'search-entities:reply';
  results: VerifiedEntitySummary[];
}

export interface GetDirectoryIntegrityRequest {
  type: 'get-directory-integrity';
}

export interface GetDirectoryIntegrityReply {
  type: 'get-directory-integrity:reply';
  source: 'bundled' | 'remote-cache' | 'remote-live';
  bundledMerkleRoot: string;
  activeMerkleRoot: string;
  remoteMerkleRoot?: string;
  updatedAt?: string;
}

export type Request = GetStatusRequest | SearchEntitiesRequest | GetDirectoryIntegrityRequest;
export type Reply = GetStatusReply | SearchEntitiesReply | GetDirectoryIntegrityReply;
