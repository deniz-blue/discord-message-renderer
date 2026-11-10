import { writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { type RenderOptions, fontOf, matchingOption, platforms, renderMessagesHtml, themes } from "./core/render.ts";
import { messagesDocument, readRenderInput } from "./io/files.ts";
import { writeMessagesPng } from "./io/png.ts";

const usage = `usage: discord-message-renderer <messages.json> [-o out.png] [--html out.html] [--width 600] [--scale 2]
       [--theme ${themes.join("|")}] [--platform ${platforms.join("|")}] [--font "Google font"] [--fonts dir]`;

const { values, positionals } = parseArgs({
	allowPositionals: true,
	options: {
		out: { type: "string", short: "o" },
		html: { type: "string" },
		width: { type: "string", default: "600" },
		scale: { type: "string", default: "2" },
		theme: { type: "string", default: "dark" },
		platform: { type: "string", default: "desktop" },
		font: { type: "string" },
		fonts: { type: "string" },
	},
});

const fail: (message: string) => never = (message) => {
	console.error(`${message}\n${usage}`);
	process.exit(1);
};

const [inputPath] = positionals;
if (inputPath === undefined) fail("no input file");

const options: RenderOptions = {
	theme: matchingOption(themes, values.theme) ?? fail(`unknown theme ${values.theme}`),
	platform: matchingOption(platforms, values.platform) ?? fail(`unknown platform ${values.platform}`),
	...(values.font === undefined ? {} : { font: values.font }),
};

const input = await readRenderInput(inputPath);
const messagesHtml = renderMessagesHtml(input, options);
if (values.html !== undefined) {
	await writeFile(values.html, await messagesDocument(messagesHtml, fontOf(options)));
	console.log(values.html);
}
if (values.out !== undefined || values.html === undefined) {
	const out = values.out ?? `${inputPath.replace(/\.json$/, "")}.png`;
	await writeMessagesPng(messagesHtml, {
		width: Number(values.width),
		scale: Number(values.scale),
		path: out,
		font: fontOf(options),
		...(values.fonts === undefined ? {} : { fontDirectory: values.fonts }),
	});
	console.log(out);
}
