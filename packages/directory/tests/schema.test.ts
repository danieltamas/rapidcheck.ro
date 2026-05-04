import { describe, expect, it } from 'bun:test';

import { loadDirectory, verifiedDirectorySchema } from '../src/index.js';

describe('@rapidcheck/directory schema', () => {
  it('accepts the bundled verified entity directory', () => {
    const directory = loadDirectory();
    expect(verifiedDirectorySchema.parse(directory).entities.length).toBeGreaterThan(70);
  });

  it('requires source evidence for every entity', () => {
    const directory = loadDirectory();
    for (const entity of directory.entities) {
      expect(entity.sourceUrls.length).toBeGreaterThan(0);
      expect(entity.sourceUrls[0]).toStartWith('https://');
    }
  });

  it('keeps entity ids unique', () => {
    const ids = loadDirectory().entities.map((entity) => entity.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
