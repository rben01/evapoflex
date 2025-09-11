# Code Style and Conventions

## Formatting

- **Prettier** with tabs for indentation
- Svelte plugin enabled for proper .svelte file formatting
- Git pre-commit hook automatically formats staged files

## TypeScript

- TypeScript enabled project-wide
- Type annotations used throughout
- Strict type checking

## Svelte 5 Patterns

- Uses `$state()` for reactive variables
- Uses `$derived()` for simple computed values
- Uses `$derived.by()` for complex computed values that require a function to compute
- Uses `$effect()` for side effects
- Component props with TypeScript interfaces

## Naming Conventions

- camelCase for variables and functions
- PascalCase for components
- Constants in SCREAMING_SNAKE_CASE

## File Structure

- Routes in `src/routes/` (file-based routing)
- Components in `src/lib/components/`
- Utilities in `src/lib/`
- Static assets in `static/`
