import { domToBlob, domToPng } from "modern-screenshot";
import "../src/core/style.css";
import "../src/core/themes.css";
import { type RenderInput, renderInputOf } from "../src/core/input.ts";
import {
	type RenderOptions,
	fontOf,
	fontStylesheetUrl,
	matchingOption,
	platforms,
	renderMessagesHtml,
	themes,
} from "../src/core/render.ts";
import { elementById } from "./elements.ts";
import { embedCodeOf } from "./embed-protocol.ts";
import { textToFragment } from "./fragment.ts";
import "./page.css";

const examples = import.meta.glob<unknown>("../examples/*.json", { eager: true, import: "default" });
const widths = ["440", "600", "800"];
const editorStorageKey = "discord-message-renderer:editor";
const pngScale = 2;

const editor = elementById("editor", HTMLTextAreaElement);
const status = elementById("status", HTMLParagraphElement);
const preview = elementById("preview", HTMLDivElement);
const fontLink = elementById("font", HTMLLinkElement);
const exampleSelect = elementById("example", HTMLSelectElement);
const themeSelect = elementById("theme", HTMLSelectElement);
const platformSelect = elementById("platform", HTMLSelectElement);
const widthSelect = elementById("width", HTMLSelectElement);
const embedButton = elementById("embed", HTMLButtonElement);
const copyButton = elementById("copy", HTMLButtonElement);
const downloadButton = elementById("download", HTMLButtonElement);

const capitalized = (word: string): string => word.charAt(0).toUpperCase() + word.slice(1);
const exampleNameOf = (path: string): string => path.replace(/^.*\//, "").replace(/\.json$/, "");

const fillSelect = (select: HTMLSelectElement, values: readonly string[], labelOf: (value: string) => string): void =>
	select.replaceChildren(...values.map((value) => new Option(labelOf(value), value)));

type ParsedEditor = { input: RenderInput; error?: undefined } | { input?: undefined; error: string };

const parseEditor = (text: string): ParsedEditor => {
	try {
		return { input: renderInputOf(JSON.parse(text)) };
	} catch (error) {
		return { error: error instanceof Error ? error.message : String(error) };
	}
};

const selectedOptions = (): RenderOptions => ({
	theme: matchingOption(themes, themeSelect.value) ?? "dark",
	platform: matchingOption(platforms, platformSelect.value) ?? "desktop",
});

const renderPreview = (): void => {
	localStorage.setItem(editorStorageKey, editor.value);
	const parsed = parseEditor(editor.value);
	status.textContent = parsed.error ?? "";
	embedButton.disabled = copyButton.disabled = downloadButton.disabled = parsed.input === undefined;
	if (parsed.input === undefined) return;
	const options = selectedOptions();
	fontLink.href = fontStylesheetUrl(fontOf(options));
	preview.style.width = `${widthSelect.value}px`;
	preview.innerHTML = renderMessagesHtml(parsed.input, options);
};

const messagesElement = (): HTMLElement => {
	const element = preview.querySelector(".messages");
	if (!(element instanceof HTMLElement)) throw new Error("nothing rendered yet");
	return element;
};

const downloadPng = async (): Promise<void> => {
	const url = await domToPng(messagesElement(), { scale: pngScale });
	Object.assign(document.createElement("a"), { href: url, download: "message.png" }).click();
};

const showCopied = (button: HTMLButtonElement): void => {
	const label = button.textContent;
	button.textContent = "Copied";
	setTimeout(() => (button.textContent = label), 1500);
};

const copyPng = async (): Promise<void> => {
	const blob = await domToBlob(messagesElement(), { scale: pngScale, type: "image/png" });
	await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
	showCopied(copyButton);
};

const copyEmbedCode = async (): Promise<void> => {
	const parsed = parseEditor(editor.value);
	if (parsed.input === undefined) return;
	const { theme = "dark", platform = "desktop" } = selectedOptions();
	const fragment = await textToFragment(JSON.stringify(parsed.input));
	const url = new URL(`embed.html?${new URLSearchParams({ theme, platform })}#${fragment}`, location.href).href;
	const height = Math.ceil(messagesElement().getBoundingClientRect().height);
	await navigator.clipboard.writeText(embedCodeOf(url, Number(widthSelect.value), height));
	showCopied(embedButton);
};

const loadExample = (path: string): void => {
	editor.value = JSON.stringify(examples[path], undefined, "\t");
	renderPreview();
};

const reportFailure = (button: HTMLButtonElement, action: () => Promise<void>) => (): void => {
	const label = button.textContent;
	action().catch((error: unknown) => (status.textContent = `${label} failed: ${error instanceof Error ? error.message : String(error)}`));
};

const examplePaths = Object.keys(examples);
fillSelect(exampleSelect, examplePaths, exampleNameOf);
fillSelect(themeSelect, themes, capitalized);
fillSelect(platformSelect, platforms, capitalized);
fillSelect(widthSelect, widths, (width) => `${width} px`);
widthSelect.value = "600";

exampleSelect.prepend(new Option("Pick one", "", true, true));
exampleSelect.options[0]?.setAttribute("disabled", "");
exampleSelect.addEventListener("change", () => {
	loadExample(exampleSelect.value);
	exampleSelect.value = "";
});
for (const control of [editor, themeSelect, platformSelect, widthSelect]) control.addEventListener("input", renderPreview);
embedButton.addEventListener("click", reportFailure(embedButton, copyEmbedCode));
copyButton.addEventListener("click", reportFailure(copyButton, copyPng));
downloadButton.addEventListener("click", reportFailure(downloadButton, downloadPng));

const savedEditor = localStorage.getItem(editorStorageKey);
if (savedEditor === null) loadExample(examplePaths[0] ?? "");
else {
	editor.value = savedEditor;
	renderPreview();
}
