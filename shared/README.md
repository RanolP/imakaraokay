# Shared Karaoke Search Libraries

This folder contains the shared libraries for the karaoke search functionality, organized by feature.

## Structure

```
shared/
├── types/           # Shared type definitions
│   ├── search-types.ts
│   └── index.ts
├── utils/           # Utility functions
│   ├── logger.ts
│   ├── fetch-utils.ts
│   ├── google-search.ts
│   └── index.ts
├── providers/       # Search provider implementations
│   ├── tj-karaoke-provider.ts
│   ├── ky-karaoke-provider.ts
│   ├── musixmatch-provider.ts
│   ├── vocaro-provider.ts
│   └── index.ts
├── search/          # Search engine and formatting
│   ├── search-engine.ts
│   ├── output-formatter.ts
│   └── index.ts
└── cli/             # CLI entry points
    ├── karaoke-search-cli.ts
    ├── karaoke-search-cli-refactored.ts
    └── README-*.md
```

## Features

### Types (`shared/types/`)
- **search-types.ts**: Core interfaces for search results, providers, and options
- Includes `KaraokeResult`, `LyricsResult`, `KaraokeProvider`, `LyricsProvider`

### Utils (`shared/utils/`)
- **logger.ts**: Logging utility with verbose mode support
- **fetch-utils.ts**: HTTP request utilities with proper headers and error handling
- **google-search.ts**: Google search service for enhanced search capabilities

### Providers (`shared/providers/`)
- **tj-karaoke-provider.ts**: TJ Karaoke search implementation
- **ky-karaoke-provider.ts**: KY Karaoke search implementation
- **musixmatch-provider.ts**: MusixMatch lyrics search implementation
- **vocaro-provider.ts**: Vocaro Wiki lyrics search with enhanced features

### Search (`shared/search/`)
- **search-engine.ts**: Main search engine that coordinates multiple providers
- **output-formatter.ts**: Formats and displays search results with colors and styling

### CLI (`shared/cli/`)
- **karaoke-search-cli.ts**: Original standalone CLI implementation
- **karaoke-search-cli-refactored.ts**: Modular CLI using the provider system
- Documentation files for architecture and usage

## Usage

Each feature folder has an `index.ts` file that exports all functionality:

```typescript
// Import specific items
import { KaraokeResult, LyricsResult } from './shared/types/index.js';
import { Logger, safeFetch } from './shared/utils/index.js';
import { TJKaraokeProvider, VocaroProvider } from './shared/providers/index.js';
import { SearchEngine, OutputFormatter } from './shared/search/index.js';

// Or import everything from a feature
import * as Types from './shared/types/index.js';
import * as Utils from './shared/utils/index.js';
import * as Providers from './shared/providers/index.js';
import * as Search from './shared/search/index.js';
```

## Migration Notes

This structure was created by moving and organizing the CLI code from `services/website/src/lib/cli/` to separate features by their functionality:

- **Types**: Shared interfaces and type definitions
- **Utils**: Reusable utility functions
- **Providers**: Individual search service implementations
- **Search**: Core search logic and result formatting
- **CLI**: Command-line interface implementations

The modular structure allows for better code organization, easier testing, and potential reuse across different parts of the application. 
