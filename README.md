# imakaraokay (今からオケー)

A comprehensive karaoke song search platform built as a monorepo with multiple services and tools.

## 🎤 What is imakaraokay?

"imakaraokay" is a Japanese wordplay combining:
- 今から (ima kara) = "from now"
- オケー (okay) = "OK"
- 今カラオケ (ima karaoke) = "now karaoke"

## 📁 Project Structure

This is a pnpm workspace monorepo with the following structure:

```
imakaraokay/
├── services/
│   └── website/          # Main Astro + Solid.js website
├── packages/
│   └── shared/           # Shared utilities and types
├── tools/
│   └── cli/              # Karaoke search CLI tool
└── docs/                 # Documentation (if needed)
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+

### Installation

```bash
# Install all dependencies across the monorepo
pnpm install

# Build shared packages
pnpm --filter @imakaraokay/shared build
```

### Development

```bash
# Start website development server
pnpm dev

# Start all services in development mode
pnpm dev:all

# Use the CLI tool
pnpm search "song name"
```

### Building

```bash
# Build the website
pnpm build

# Build all packages
pnpm build:all
```

## 📦 Packages

### Services

- **@imakaraokay/website** - Main karaoke search website built with Astro and Solid.js

### Packages

- **@imakaraokay/shared** - Shared utilities, types, and constants used across services

### Tools

- **@imakaraokay/cli** - Command-line tool for searching karaoke songs

## 🛠 Technologies

- **Frontend**: Astro, Solid.js, UnoCSS
- **Search**: Fuse.js with NFKD normalization
- **Styling**: UnoCSS with custom karaoke color palette
- **Internationalization**: Custom i18n system (Korean/English)
- **Build**: Static Site Generation (SSG)
- **Deployment**: GitHub Pages with GitHub Actions
- **Package Management**: pnpm workspaces

## 🎨 Features

- **Multi-provider Search**: TJ, KY, Joysound, EBO karaoke machines
- **Advanced Search**: NFKD normalization for accurate Korean/Japanese text matching
- **Responsive Design**: Modern UI with karaoke-themed color palette
- **Internationalization**: Korean (primary) and English support
- **Static Generation**: Pre-generated pages for optimal performance
- **CLI Tool**: Command-line interface for quick searches

## 🌈 Karaoke Machine Support

| Provider | Color | ID Format |
|----------|-------|-----------|
| TJ | #00AFEC (cyan-blue) | 5-6 digits |
| KY | #8877dd (purple-blue) | 5-6 digits |
| Joysound | #d70e18 (red) | 6-8 digits |
| EBO | #6b7280 (gray) | 4-6 digits |

## 📝 Scripts

```bash
# Development
pnpm dev              # Start website dev server
pnpm dev:all          # Start all services in dev mode

# Building
pnpm build            # Build website
pnpm build:all        # Build all packages

# CLI
pnpm search "query"   # Search for karaoke songs

# Maintenance
pnpm clean            # Clean all build outputs
pnpm type-check       # Run TypeScript checks
```

## 🤝 Contributing

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Make your changes
4. Build and test: `pnpm build:all`
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.


