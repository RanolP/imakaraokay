# 🎤 imakaraokay

Find your favorite songs across all karaoke machines! A comprehensive database of karaoke songs with their corresponding machine IDs for TJ Karaoke, KY Karaoke, and Joysound.

## Features

- 🔍 **Unified Search** - Search by song title, artist, or lyrics across all languages
- 🌐 **Multilingual Support** - Korean, English, and Japanese language switching
- 📱 **Mobile-Friendly** - Responsive design optimized for mobile karaoke sessions
- ⚡ **Lightning Fast** - Static-generated pages with SolidJS islands for optimal performance
- 🎯 **Accurate Mapping** - Precise karaoke machine ID mapping across systems

## Technology Stack

- **[Astro](https://astro.build)** - For lightning-fast static site generation
- **[SolidJS](https://solidjs.com)** - For reactive, efficient islands of interactivity
- **[UnoCSS](https://unocss.dev)** - For atomic CSS styling
- **[TypeScript](https://typescriptlang.org)** - For type-safe development

## Getting Started

This project uses [pnpm](https://pnpm.io) as the package manager.

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

## Project Structure

```
src/
├── components/          # Reusable SolidJS components
├── features/           # Feature-specific modules (i18n, etc.)
├── layouts/            # Astro layout components
├── pages/              # Astro pages (routes)
│   ├── index.astro     # Home page
│   ├── about.astro     # About page
│   └── songs/          # Dynamic song pages
├── services/           # Business logic and data services
└── types/              # TypeScript type definitions

public/
└── data/               # JSON data files (songs, artists)
```

## Deployment

The `dist` folder can be deployed to any static host provider:
- **Netlify**
- **Vercel** 
- **GitHub Pages**
- **Cloudflare Pages**

This project was migrated from a SolidJS router template to use modern Astro architecture.


