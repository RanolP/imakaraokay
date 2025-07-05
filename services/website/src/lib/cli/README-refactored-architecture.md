# Refactored Karaoke Search CLI Architecture

## Overview

The karaoke search CLI has been refactored into a modular, extensible architecture with clear separation of concerns and proper interfaces.

## File Structure

```
scripts/
├── types/
│   └── search-types.ts          # Type definitions and interfaces
├── utils/
│   ├── fetch-utils.ts           # HTTP request utilities
│   └── logger.ts                # Logging utility
├── providers/
│   ├── tj-karaoke-provider.ts   # TJ Karaoke search implementation
│   ├── ky-karaoke-provider.ts   # KY Karaoke search implementation
│   ├── musixmatch-provider.ts   # MusixMatch lyrics search
│   └── vocaro-provider.ts       # Vocaro Wiki lyrics search
├── search-engine.ts             # Main search orchestrator
├── output-formatter.ts          # Result formatting and display
└── karaoke-search-cli-refactored.ts  # CLI entry point
```

## Architecture Principles

### 1. **Interface-Based Design**
- `KaraokeProvider` and `LyricsProvider` interfaces ensure consistent implementation
- Easy to add new search providers without changing existing code
- Type safety through TypeScript interfaces

### 2. **Single Responsibility Principle**
- Each provider handles only one search service
- Utilities are focused on specific concerns (HTTP, logging)
- Clear separation between search logic and presentation

### 3. **Dependency Injection**
- Providers receive logger instances through constructor
- Search engine manages provider registration
- Easy to test and mock dependencies

### 4. **Error Isolation**
- Each provider's errors don't affect others
- Graceful degradation when services fail
- Comprehensive error logging

## Key Components

### Types (`types/search-types.ts`)
- **Interfaces**: Define contracts for providers
- **Result Types**: Structured data for karaoke and lyrics results
- **Options**: Configuration for search operations

### Utilities
- **`fetch-utils.ts`**: Centralized HTTP handling with consistent headers and timeout
- **`logger.ts`**: Simple logging with verbose mode support

### Providers
Each provider implements either `KaraokeProvider` or `LyricsProvider`:
- **TJ Karaoke**: ✅ Working - uses tjmedia.com API
- **KY Karaoke**: ⚠️ Partial - uses kysing.kr (needs CSS filtering improvement)
- **MusixMatch**: 🔄 Needs updates for current website structure
- **Vocaro**: 🔄 Basic implementation, may need refinement

### Search Engine (`search-engine.ts`)
- **Provider Management**: Register and manage multiple providers
- **Parallel Execution**: Searches all providers simultaneously
- **Result Aggregation**: Combines results from all sources
- **Error Handling**: Isolates provider failures

### Output Formatter (`output-formatter.ts`)
- **Consistent Display**: Unified formatting for all result types
- **Source Grouping**: Groups results by provider
- **Color Coding**: Different colors for different sources
- **No Results Handling**: Helpful tips when no results found

## Usage

### Basic Usage
```bash
pnpm run search "song title"
```

### Verbose Mode
```bash
pnpm run search "song title" -- -v
```

### Direct Execution
```bash
pnpm exec tsx scripts/karaoke-search-cli-refactored.ts -v "song title"
```

## Benefits of Refactoring

### 1. **Maintainability**
- Small, focused files are easier to understand and modify
- Clear interfaces make it obvious what each component does
- Changes to one provider don't affect others

### 2. **Extensibility**
- Adding new search providers requires minimal code changes
- Easy to add new features (caching, rate limiting, etc.)
- Provider-specific optimizations don't affect the overall architecture

### 3. **Testability**
- Each component can be unit tested independently
- Mock providers can be easily created for testing
- Dependencies are clearly defined and injectable

### 4. **Reusability**
- Components can be reused in other projects
- Providers can be used standalone
- Utilities are general-purpose

## Adding New Providers

To add a new karaoke or lyrics provider:

1. **Create Provider File**: `scripts/providers/new-provider.ts`
2. **Implement Interface**: Extend `KaraokeProvider` or `LyricsProvider`
3. **Register Provider**: Add to `karaoke-search-cli-refactored.ts`

Example:
```typescript
export class NewKaraokeProvider implements KaraokeProvider {
  name = 'New Service';
  
  constructor(private logger: Logger) {}

  async search(query: string): Promise<KaraokeResult[]> {
    // Implementation here
  }
}
```

## Migration from Original

The original monolithic file has been completely replaced with this modular architecture while maintaining:
- ✅ All existing functionality
- ✅ Same CLI interface
- ✅ Same output format
- ✅ All search providers
- ✅ Error handling
- ✅ Verbose logging

## Future Improvements

1. **Caching Layer**: Add result caching to avoid repeated requests
2. **Rate Limiting**: Implement per-provider rate limiting
3. **Configuration**: External config file for provider settings
4. **Parallel Optimization**: Fine-tune concurrent request handling
5. **Provider Health Checks**: Monitor and disable failing providers
6. **Result Ranking**: Score and rank results across providers 
