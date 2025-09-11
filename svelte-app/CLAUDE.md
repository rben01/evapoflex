# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a SvelteKit application using **Svelte 5** with TypeScript and D3.js for data visualization. The project is configured for static site generation using the `@sveltejs/adapter-static` adapter.

## Key Architecture

- **Framework**: SvelteKit with Svelte 5
- **Language**: TypeScript throughout
- **Visualization**: D3.js v7 for charts and graphs
- **Build**: Vite as the build tool
- **Deployment**: Static adapter generates files to `build/` directory
- **Styling**: Component-scoped CSS with global styles in `src/app.css`

## Development Commands

**Start development server:**

```bash
npm run dev
```

**Build for production (static site):**

```bash
npm run build
```

**Preview production build:**

```bash
npm run preview
```

**TypeScript and Svelte checking:**

```bash
npm run check          # One-time check
npm run check:watch    # Watch mode
```

**Format code with Prettier:**

```bash
npm run format
```

## Project Structure

- `src/routes/` - SvelteKit pages using file-based routing
- `src/lib/components/` - Reusable Svelte components
- `src/app.html` - HTML template (not index.html - this is SvelteKit)
- `static/` - Static assets served from root
- `build/` - Generated static site output (gitignored)

## D3 Integration Pattern

Components integrate D3 using the `onMount` lifecycle:

- Bind a DOM element with `bind:this={container}`
- Use `d3.select(container)` to create D3 visualizations
- D3 code runs client-side after component mounts

## Static Generation

All routes are prerendered by default via:

- `adapter-static` in `svelte.config.js`
- `export const prerender = true` in route files
- Builds to static HTML/CSS/JS in `build/` directory

## Code Formatting

The project uses Prettier with tabs and Svelte plugin. A git pre-commit hook at `.git/hooks/pre-commit` automatically formats staged files. Configuration in `.prettierrc` includes the `prettier-plugin-svelte` plugin for proper Svelte file formatting.

## Important Notes

- This project uses **Svelte 5** - be aware of syntax differences from Svelte 4
- TypeScript is enabled project-wide
- Static adapter requires all routes to be prerenderable
- D3 manipulates DOM directly - ensure it runs after component mount
- NEVER use `overflow:hidden` to fix scroll issues. ALWAYS be smart and just make
  elements fit correctly.
