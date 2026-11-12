import { writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { type RenderOptions, fontOf, platforms, renderOptionsOf, themes } from "./core/options.ts";
import { errorMessageOf } from "./core/errors.ts";
import { renderMessagesHtml } from "./core/render.ts";
import { messagesDocument, readRenderInput } from "./io/files.ts";
import { type ImageFormats, writeMessagesImage } from "./io/image.ts";

const usage = `usage: discord-message-renderer <messages.json> [-o out.png|out.jpeg|out.webp] [--html out.html] [--width 600] [--scale 2]
			 [--theme ${themes.join("|")}] [--platform ${platforms.join("|")}] [--font "Google font"] [--fonts dir]`;

const { values, positionals } = parseArgs({
	allowPositionals: true,
	options: {
		out: { type: "string", short: "o" },
		html: { type: "string" },
		width: { type: "string", default: "600" },
		scale: { type: "string", default: "2" },
		theme: { type: "string" },
		platform: { type: "string" },
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

const readOptions = (): RenderOptions => {
	try {
		return renderOptionsOf((name) => values[name]);
	} catch (error) {
		return fail(errorMessageOf(error));
	}
};

const options = readOptions();

const input = await readRenderInput(inputPath);
const messagesHtml = renderMessagesHtml(input, options);
if (values.html !== undefined) {
	await writeFile(values.html, await messagesDocument(messagesHtml, fontOf(options)));
	console.log(values.html);
}
if (values.out !== undefined || values.html === undefined) {
	const out = values.out ?? `${inputPath.replace(/\.json$/, "")}.png`;
	let format = out.match(/\.(png|jpe?g|webp)$/)?.[1];

	if (format === 'jpg') {
		format = 'jpeg';
	}

	await writeMessagesImage(messagesHtml, {
		width: Number(values.width),
		scale: Number(values.scale),
		path: out,
		font: fontOf(options),
		format: format as ImageFormats,
		...(values.fonts === undefined ? {} : { fontDirectory: values.fonts }),
	});
	console.log(out);
}
