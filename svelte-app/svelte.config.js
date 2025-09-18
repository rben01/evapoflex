import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

export default {
	kit: {
		adapter: adapter({
			pages: "build",
			assets: "build",
			fallback: undefined,
			precompress: false,
			strict: true,
		}),
		paths: {
			base: process.env.NODE_ENV === "production" ? "/evapoflex" : "",
		},
	},
	preprocess: vitePreprocess(),
};
