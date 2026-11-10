import { resolve } from "node:path";
import { defineConfig } from "vite";

const page = (name: string): string => resolve(import.meta.dirname, "web", name);

export default defineConfig({
	root: "web",
	build: {
		outDir: "../dist",
		emptyOutDir: true,
		rolldownOptions: { input: [page("index.html"), page("embed.html")] },
	},
});
