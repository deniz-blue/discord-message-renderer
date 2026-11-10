import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { render } from "takumi-js";
import { fontStylesheetUrl } from "../core/options.ts";
import { readStylesheet } from "./files.ts";

export type PngOptions = { width: number; scale: number; path: string; font: string; fontDirectory?: string };

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

export const writeMessagesPng = async (messagesHtml: string, options: PngOptions): Promise<void> => {
	const [fontFaces, stylesheet, fonts] = await Promise.all([
		fetchText(fontStylesheetUrl(options.font)),
		readStylesheet(),
		readFontFiles(options.fontDirectory),
	]);
	const png = await render(messagesHtml, {
		width: options.width * options.scale,
		devicePixelRatio: options.scale,
		css: [fontFaces, stylesheet],
		fonts,
		images: { throwOnError: false },
	});
	await writeFile(options.path, png);
};
