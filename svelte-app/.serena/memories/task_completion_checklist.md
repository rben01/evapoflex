# Task Completion Checklist

## Before Completing Tasks
1. Run `npm run check` - TypeScript and Svelte validation
2. Run `npm run format` - Code formatting with Prettier
3. Test in development mode with `npm run dev`
4. Build and preview with `npm run build && npm run preview`

## Code Quality Standards
- All TypeScript errors must be resolved
- All components must be properly typed
- Svelte 5 syntax must be used correctly
- No runtime errors in browser console

## Static Site Requirements
- All routes must be prerenderable
- No client-only code that breaks static generation
- D3 visualizations must run after component mount