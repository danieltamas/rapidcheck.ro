import type { DomainStatus } from './types.js';
import type { SensitiveDataMatch } from './sensitive-data.js';

export type SubmitRiskLevel = 'safe' | 'caution' | 'block';

export interface SubmitRiskInput {
  pageStatus: DomainStatus;
  actionStatus: DomainStatus;
  sensitiveMatches: SensitiveDataMatch[];
  isHttps: boolean;
  sameOrigin: boolean;
}

export interface SubmitRisk {
  level: SubmitRiskLevel;
  reasons: string[];
}

export function assessSubmitRisk(input: SubmitRiskInput): SubmitRisk {
  const reasons: string[] = [];
  if (!input.isHttps) reasons.push('Pagina nu folosește HTTPS.');
  if (input.pageStatus.kind === 'lookalike') {
    reasons.push(`Domeniul seamănă cu ${input.pageStatus.nearest.domain}, dar nu este același.`);
  }
  if (input.actionStatus.kind === 'lookalike') {
    reasons.push(`Formularul trimite date către un domeniu suspect.`);
  }
  if (input.actionStatus.kind === 'unknown' && !input.sameOrigin) {
    reasons.push('Formularul trimite date către un domeniu neverificat.');
  }
  if (input.pageStatus.kind === 'unknown' && input.sensitiveMatches.length > 0) {
    reasons.push('Pagina este neverificată și formularul conține date sensibile.');
  }
  if (input.pageStatus.kind === 'lookalike' || input.actionStatus.kind === 'lookalike') {
    return { level: 'block', reasons };
  }
  if (reasons.length > 0) return { level: 'caution', reasons };
  return { level: 'safe', reasons: [] };
}
