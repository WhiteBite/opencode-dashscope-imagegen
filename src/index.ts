import type { Plugin, PluginInput } from '@opencode-ai/plugin';
import { tool } from '@opencode-ai/plugin';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join, isAbsolute, dirname } from 'node:path';

const SERVICE = 'dashscope-imagegen';
const ENDPOINT =
  'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';
const DEFAULT_MODEL = 'qwen-image-2.0';

/** Structured logger via the OpenCode SDK; never throws. */
function makeLog(client: PluginInput['client']) {
  return (level: 'info' | 'error', message: string, extra?: Record<string, unknown>) => {
    try {
      void client.app.log({ body: { service: SERVICE, level, message, extra } }).catch(() => {});
    } catch {
      // logging must never break generation
    }
  };
}

function configDir(): string {
  return (
    process.env.OPENCODE_CONFIG_DIR ??
    join(process.env.USERPROFILE ?? process.env.HOME ?? '.', '.config', 'opencode')
  );
}

/** Resolve DashScope API key: env first, then opencode config (dashscope* providers). */
function resolveApiKey(): string {
  const fromEnv = process.env.DASHSCOPE_IMAGEGEN_API_KEY ?? process.env.DASHSCOPE_API_KEY;
  if (fromEnv) return fromEnv;

  try {
    const cfgPath = join(configDir(), 'opencode.json');
    const cfg = JSON.parse(readFileSync(cfgPath, 'utf-8')) as {
      provider?: Record<string, { options?: { apiKey?: string } }>;
    };
    for (const [name, prov] of Object.entries(cfg.provider ?? {})) {
      if (name.startsWith('dashscope') && prov?.options?.apiKey) {
        return prov.options.apiKey;
      }
    }
  } catch {
    // fall through
  }
  throw new Error(
    'No DashScope API key found. Set DASHSCOPE_API_KEY env or configure a dashscope* provider in opencode.json.'
  );
}

function outputDir(): string {
  return process.env.DASHSCOPE_IMAGEGEN_DIR ?? join(configDir(), 'gen-images');
}

/** Build the DashScope multimodal-generation request body. */
export function buildRequestBody(model: string, prompt: string, size: string) {
  return {
    model,
    input: {
      messages: [{ role: 'user', content: [{ text: prompt }] }],
    },
    parameters: { size },
  };
}

/** Extract the generated image URL from a DashScope response payload. */
export function extractImageUrl(json: {
  code?: string;
  message?: string;
  status?: number;
  output?: {
    choices?: { message?: { content?: { image?: string }[] } }[];
  };
}): string {
  const url = json.output?.choices?.[0]?.message?.content?.[0]?.image;
  if (!url) {
    throw new Error(
      `DashScope image generation failed: ${json.code ?? json.status ?? 'unknown'} ${json.message ?? ''}`
    );
  }
  return url;
}

/** Decide where the PNG lands: explicit absolute path or auto-named file in dir. */
export function computeOutputPath(outputPath: string | undefined, dir: string, isoTs: string) {
  if (outputPath === undefined) return join(dir, `gen-${isoTs}.png`);
  if (!isAbsolute(outputPath)) throw new Error('output_path must be an absolute path');
  return outputPath;
}

async function generateImageUrl(apiKey: string, model: string, prompt: string, size: string) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildRequestBody(model, prompt, size)),
  });
  const json = (await res.json()) as Parameters<typeof extractImageUrl>[0] & { status?: number };
  return extractImageUrl({ ...json, status: res.status });
}

interface GenArgs {
  prompt: string;
  model?: string;
  size?: string;
  output_path?: string;
}

async function runGenerate(args: GenArgs) {
  const apiKey = resolveApiKey();
  const model = args.model ?? DEFAULT_MODEL;
  const size = args.size ?? '1024*1024';

  const url = await generateImageUrl(apiKey, model, args.prompt, size);
  const imgRes = await fetch(url);
  if (!imgRes.ok) {
    throw new Error(`Image download failed: ${imgRes.status}`);
  }
  const buf = Buffer.from(await imgRes.arrayBuffer());

  const outPath = computeOutputPath(
    args.output_path,
    outputDir(),
    new Date().toISOString().replace(/[:.]/g, '-')
  );
  if (!existsSync(dirname(outPath))) mkdirSync(dirname(outPath), { recursive: true });

  writeFileSync(outPath, buf);
  const dataUrl = `data:image/png;base64,${buf.toString('base64')}`;
  return {
    title: 'Generated image',
    output: `Image generated and saved to: ${outPath}`,
    attachments: [
      {
        type: 'file' as const,
        mime: 'image/png',
        url: dataUrl,
        filename: outPath.split(/[\\/]/).pop(),
      },
    ],
  };
}

export const DashscopeImagegenPlugin: Plugin = async ({ client }) => {
  const log = makeLog(client);
  log('info', 'plugin initialized, registering image_generate tool');
  return {
    tool: {
      image_generate: tool({
        description:
          'Generate an image from a text prompt via Alibaba DashScope (qwen-image-2.0 / qwen-image-3.0 / wan2.7-image). Saves PNG to disk and returns the absolute file path plus an image attachment.',
        args: {
          prompt: tool.schema.string().describe('Image description'),
          model: tool.schema.string().optional().describe('Model id (default: qwen-image-2.0)'),
          size: tool.schema
            .string()
            .optional()
            .describe('Size as WxH with star, e.g. 1024*1024 (default)'),
          output_path: tool.schema
            .string()
            .optional()
            .describe('Absolute output file path (default: auto-named in gen-images dir)'),
        },
        async execute(args) {
          log('info', 'image_generate called', {
            prompt: args.prompt.slice(0, 80),
            model: args.model ?? DEFAULT_MODEL,
            size: args.size ?? '1024*1024',
          });
          try {
            return await runGenerate(args);
          } catch (e) {
            log('error', 'image_generate failed', {
              error: e instanceof Error ? e.message : String(e),
            });
            throw e;
          }
        },
      }),
    },
  };
};
