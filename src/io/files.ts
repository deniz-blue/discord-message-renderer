import { readFile } from "node:fs/promises";
import { type RenderInput, renderInputOf } from "../core/input.ts";
import { fontStylesheetUrl } from "../core/options.ts";

const stylePaths = ["../core/style.css", "../core/themes.css"].map((path) => new URL(path, import.meta.url));

export const readRenderInput = async (path: string): Promise<RenderInput> =>
	renderInputOf(JSON.parse(await readFile(path, "utf8")));

export const readStylesheet = async (): Promise<string> =>
	(await Promise.all(stylePaths.map((path) => readFile(path, "utf8")))).join("\n");

export const messagesDocument = async (messagesHtml: string, font: string): Promise<string> =>
	`<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${fontStylesheetUrl(font)}"><style>${await readStylesheet()}</style><style>body{margin:0}</style></head><body>${messagesHtml}</body></html>`;
