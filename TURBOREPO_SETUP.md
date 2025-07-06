# Turborepo Setup for imakaraokay

This project now uses [Turborepo](https://turbo.build/) to manage dependencies and builds across the monorepo.

## Project Structure

```
imakaraokay/
├── packages/
│   └── shared/              # @imakaraokay/shared - Shared utilities and types
└── services/
    └── website/             # @imakaraokay/website - Main website service
```

## Available Commands

### Build Commands
- `pnpm build` - Build all packages (shared first, then website)
- `pnpm build:libs` - Build only the shared package
- `pnpm build:all` - Same as `pnpm build`

### Development Commands
- `pnpm dev` - Start development mode for all packages
- `pnpm dev:libs` - Start development mode for shared package only
- `pnpm dev:all` - Same as `pnpm dev`

### Other Commands
- `pnpm type-check` - Run type checking across all packages
- `pnpm lint` - Run linting across all packages
- `pnpm clean` - Clean build artifacts from all packages

## Turborepo Configuration

The `turbo.json` file defines the task pipeline:

- **Build Task**: Builds packages in dependency order (shared → website)
- **Dev Task**: Runs development servers (persistent tasks)
- **Type-check Task**: Runs after build dependencies are ready
- **Lint Task**: Runs after build dependencies are ready
- **Clean Task**: Removes build artifacts (no caching)

## Key Features

### Dependency Management
- Turborepo automatically handles build order based on package dependencies
- The website depends on the shared package, so shared builds first

### Caching
- Build outputs are cached for faster subsequent builds
- Development tasks don't use caching (persistent mode)
- Cache is stored in `.turbo/` directory (gitignored)

### Filtering
- Use `--filter` to run tasks on specific packages:
  ```bash
  pnpm turbo run build --filter=@imakaraokay/shared
  pnpm turbo run dev --filter=@imakaraokay/website
  ```

### Parallel Execution
- Independent tasks run in parallel for better performance
- Dependent tasks wait for their dependencies to complete

## Migration from Previous Setup

### Before (using tsdown directly)
```bash
tsdown && pnpm -F website build
```

### After (using Turborepo)
```bash
pnpm turbo run build
```

Turborepo automatically:
1. Builds the shared package first
2. Then builds the website (which depends on shared)
3. Caches results for faster subsequent builds
4. Runs tasks in parallel where possible

## Package-specific Build Tools

Each package still uses its own build tools:
- **Shared Package**: Uses `tsdown` for TypeScript compilation
- **Website Service**: Uses `astro build` for static site generation

Turborepo orchestrates these tools but doesn't replace them. 
