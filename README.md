# Image Tool

A CLI tool for image manipulation.

## Installation

```bash
npm install -g img-tool
```

or

```bash
yarn global add img-tool
```

or

```bash
pnpm add -g img-tool
```

or

```bash
bun add -g img-tool
```

## Usage

```bash
img-tool -i <input> [options]

Options:
  -i, --input      Input file or directory path (required)
  -o, --output     Output path (default: ./output)
  -d, --dimension  Resize dimension (e.g., "100x100" or "100" for square)
  -q, --quality    Output quality (1-100, default: 50)
  -f, --format     Output format (jpeg|png|webp|avif, default: webp)
  -h, --help       Show this help message
```
