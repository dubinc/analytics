import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { verifyOutputs } from './verify-outputs';

let dir;

describe('verifyOutputs', () => {
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dub-script-'));
  });

  afterEach(() => {
    fs.rmSync(dir, {
      recursive: true,
      force: true,
    });
  });

  it('passes when every output exists with content', () => {
    const file = path.join(dir, 'script.js');
    fs.writeFileSync(file, '(()=>{})();');

    expect(() => verifyOutputs([file])).not.toThrow();
  });

  it('fails and names every missing or empty output', () => {
    const built = path.join(dir, 'script.js');
    const empty = path.join(dir, 'script.site-visit.js');
    const missing = path.join(dir, '_redirects');
    fs.writeFileSync(built, '(()=>{})();');
    fs.writeFileSync(empty, '');

    expect(() => verifyOutputs([built, empty, missing])).toThrow(
      `Missing or empty build output: ${empty}, ${missing}`,
    );
  });
});
