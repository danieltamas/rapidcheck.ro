import anafLogoUrl from '../assets/anaf-logo.jpg?inline';

export function resolveAsset(src: string): string {
  if (src === 'asset:anaf-logo') return anafLogoUrl;
  return src;
}
