import { GlobalRegistrator } from '@happy-dom/global-registrator';

let installed = false;

export function setupDom(): void {
  if (installed) return;
  GlobalRegistrator.register({ url: 'https://example.test/' });
  installed = true;
}
