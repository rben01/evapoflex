# Project Overview

This is a **SvelteKit weather analysis application** using Svelte 5 with TypeScript and D3.js. The project analyzes evaporation-powered engine performance through interactive visualizations.

## Purpose
The application calculates and visualizes:
- Evaporation rates using psychrometric equations
- Power generation potential from humidity differentials
- Total latent energy from evaporation processes

## Tech Stack
- **Framework**: SvelteKit with Svelte 5
- **Language**: TypeScript throughout
- **Visualization**: D3.js v7 for charts
- **Build Tool**: Vite
- **Deployment**: Static site generation (`@sveltejs/adapter-static`)
- **Styling**: Component-scoped CSS with global styles

## Key Components
- Interactive parameter controls (temperature, humidity, wind speed, latitude)
- Real-time thermodynamic calculations
- Three main visualizations: Total Latent Energy, Daily Evaporation, Maximum Engine Power
- Responsive layout with mobile optimization