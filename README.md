# opencode-dashscope-imagegen

[OpenCode](https://opencode.ai) plugin: text-to-image generation via **Alibaba DashScope**
(`qwen-image-2.0`, `qwen-image-3.0`, `wan2.7-image` and compatible models).
Adds an `image_generate` tool that saves the PNG to disk and returns its path.

## Install

Add to your `opencode.json` (local path or npm spec once published):

```json
{
  "plugin": ["D:/Sources/WhiteBite/opencode-dashscope-imagegen/src/index.ts"]
}
```

## Auth

Key resolution order:

1. `DASHSCOPE_IMAGEGEN_API_KEY` env
2. `DASHSCOPE_API_KEY` env
3. `apiKey` of any `dashscope*` provider in your `opencode.json`

## Usage

The agent gets a tool:

| Arg | Default | Description |
|-----|---------|-------------|
| `prompt` | required | image description |
| `model` | `qwen-image-2.0` | any DashScope text2image model |
| `size` | `1024*1024` | `W*H` (star, not `x`) |
| `output_path` | auto | absolute path; default `~/.config/opencode/gen-images/gen-<ts>.png` |

Output dir override: `DASHSCOPE_IMAGEGEN_DIR` env.

## Notes

- Uses the native DashScope endpoint
  `POST /api/v1/services/aigc/multimodal-generation/generation`
  (the OpenAI-compatible `/v1/images/generations` is not served by DashScope).
- Vision models (kimi-k3, qwen3.8-max, qwen-vl-*) can then inspect the saved PNG
  via normal image attachments.

## License

MIT
