import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildRequestBody, computeOutputPath, extractImageUrl } from '../src/index.js';

describe('buildRequestBody', () => {
  it('wraps the prompt in the multimodal-generation message shape', () => {
    expect(buildRequestBody('qwen-image-2.0', 'a cat', '1024*1024')).toEqual({
      model: 'qwen-image-2.0',
      input: { messages: [{ role: 'user', content: [{ text: 'a cat' }] }] },
      parameters: { size: '1024*1024' },
    });
  });
});

describe('extractImageUrl', () => {
  const ok = {
    output: {
      choices: [{ message: { content: [{ image: 'https://example.com/x.png' }] } }],
    },
  };

  it('returns the image url from a valid payload', () => {
    expect(extractImageUrl(ok)).toBe('https://example.com/x.png');
  });

  it('throws with the API error code when the payload has no image', () => {
    expect(() => extractImageUrl({ code: 'InvalidApiKey', message: 'bad key' })).toThrow(
      /InvalidApiKey.*bad key/
    );
  });

  it('falls back to the http status when the API code is absent', () => {
    expect(() => extractImageUrl({ status: 500 })).toThrow(/500/);
  });
});

describe('computeOutputPath', () => {
  it('auto-names files inside the output dir', () => {
    const dir = '/tmp/gen';
    const ts = '2026-08-30T00-00-00-000Z';
    expect(computeOutputPath(undefined, dir, ts)).toBe(join(dir, `gen-${ts}.png`));
  });

  it('keeps an explicit absolute path', () => {
    expect(computeOutputPath('C:\\out\\x.png', '/tmp/gen', 'ts')).toBe('C:\\out\\x.png');
  });

  it('rejects relative paths', () => {
    expect(() => computeOutputPath('rel/x.png', '/tmp/gen', 'ts')).toThrow(/absolute/);
  });
});
