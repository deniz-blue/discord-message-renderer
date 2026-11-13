import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Renderer } from "@takumi-rs/core";
import { render, renderAnimation } from "takumi-js";
import { fontStylesheetUrl } from "../core/options.ts";
import { readStylesheet } from "./files.ts";

export type ImageFormats = "png" | "jpeg" | "webp" | "gif";
export type ImageOptions = { width: number; scale: number; path: string; font: string; format: ImageFormats, fontDirectory?: string, fps?: number, duration?: number };

const fontFilePattern = /\.(ttf|otf|woff2?)$/i;

const readFontFiles = async (directory: string | undefined): Promise<Buffer[]> => {
	if (directory === undefined) return [];
	const names = (await readdir(directory)).filter((name) => fontFilePattern.test(name));
	return Promise.all(names.map((name) => readFile(join(directory, name))));
};

const fetchText = async (url: string): Promise<string> => {
	const response = await fetch(url);
	if (!response.ok) throw new Error(`${url} answered ${response.status}`);
	return response.text();
};

export const writeMessagesImage = async (messagesHtml: string, options: ImageOptions): Promise<void> => {
	const [fontFaces, stylesheet, fonts] = await Promise.all([
		fetchText(fontStylesheetUrl(options.font)),
		readStylesheet(),
		readFontFiles(options.fontDirectory),
	]);

	const renderOptions = {
		width: options.width * options.scale,
		devicePixelRatio: options.scale,
		css: [fontFaces, stylesheet],
		fonts,
		format: options.format as any // Set to any in order to reduce repetitive code because takumi-js uses discriminated unions.
	};

	let image;

	if (options.format === "gif") {
		const renderer = new Renderer();
		const layout = await renderer.measure(messagesHtml, renderOptions);

		image = await renderAnimation({
			height: Math.ceil(layout.height),
			fps: options.fps ?? 30,
			scenes: [{
				durationMs: options.duration ?? 10000,
				node: messagesHtml
			}],
			...renderOptions
		});
	} else {
		image = await render(messagesHtml, {
			images: { throwOnError: false },
			...renderOptions
		});
	}

	await writeFile(options.path, image);
};
