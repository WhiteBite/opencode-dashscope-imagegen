# Changelog

## [0.1.3](https://github.com/WhiteBite/opencode-dashscope-imagegen/compare/v0.1.2...v0.1.3) (2026-08-30)


### Bug Fixes

* make absolute-path test platform-independent ([cb4348b](https://github.com/WhiteBite/opencode-dashscope-imagegen/commit/cb4348b30a43aa5703526c94f2597f24dd02f462))

## [0.1.2](https://github.com/WhiteBite/opencode-dashscope-imagegen/compare/v0.1.1...v0.1.2) (2026-08-30)

### ♻️ Refactors

- align plugin with official template: named export, tsc build with type declarations, structured logging via `client.app.log`, npm provenance attestation

## [0.1.1](https://github.com/WhiteBite/opencode-dashscope-imagegen/compare/v0.1.0...v0.1.1) (2026-08-30)

### 📝 Documentation

- rewrite README with npm install, badges, example output and troubleshooting

### 🧹 Chores

- add MIT license file
- enrich package metadata for npm discoverability (repository, homepage, bugs, keywords)

## [0.1.0](https://github.com/WhiteBite/opencode-dashscope-imagegen/compare/v0.0.0...v0.1.0) (2026-08-30)

### 🎉 Features

- `image_generate` tool via DashScope multimodal-generation API (qwen-image-2.0/3.0, wan2.7-image)
- generated image returned as chat attachment and saved to disk
- API key resolution from env or `dashscope*` providers in opencode.json

### 🛠️ CI

- GitHub Actions: typecheck on push/PR, npm publish on release
