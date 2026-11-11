import { domToBlob, domToPng } from "modern-screenshot";
import { errorMessageOf } from "../src/core/errors.ts";
import { type RenderInput, renderInputOf } from "../src/core/input.ts";
import { type RenderOptions, platforms, renderOptionsOf, themes } from "../src/core/options.ts";
import { elementById } from "./elements.ts";
import { embedCodeOf } from "./embed-protocol.ts";
import { textToFragment } from "./fragment.ts";
import "./page.css";
import { showMessages } from "./show-messages.ts";

const examples = import.meta.glob<unknown>("../examples/*.json", { eager: true, import: "default" });
const widths = ["440", "600", "800"];
const editorStorageKey = "discord-message-renderer:editor";
const pngScale = 2;
const firstVisitExample = "../examples/1-chat.json";

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
const exampleNameOf = (path: string): string => path.replace(/^.*\/(\d+-)?/, "").replace(/\.json$/, "");

const fillSelect = (select: HTMLSelectElement, values: readonly string[], labelOf: (value: string) => string): void =>
	select.replaceChildren(...values.map((value) => new Option(labelOf(value), value)));

type ParsedEditor = { input: RenderInput; error?: undefined } | { input?: undefined; error: string };

const parseEditor = (text: string): ParsedEditor => {
	try {
		return { input: renderInputOf(JSON.parse(text)) };
	} catch (error) {
		return { error: errorMessageOf(error) };
	}
};

const optionSelects: Partial<Record<keyof RenderOptions, HTMLSelectElement>> = { theme: themeSelect, platform: platformSelect };

const selectedOptions = (): RenderOptions => renderOptionsOf((name) => optionSelects[name]?.value);

const renderPreview = (): void => {
	localStorage.setItem(editorStorageKey, editor.value);
	const parsed = parseEditor(editor.value);
	status.textContent = parsed.error ?? "";
	embedButton.disabled = copyButton.disabled = downloadButton.disabled = parsed.input === undefined;
	if (parsed.input === undefined) return;
	preview.style.width = `${widthSelect.value}px`;
	showMessages(preview, fontLink, parsed.input, selectedOptions());
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

const showCopying = (button: HTMLButtonElement): void => {
	Object.assign(button, {
		textContent: "Copying...",
		disabled: true,
		style: {
			cursor: "not-allowed"
		}
	});
};

const showCopied = (button: HTMLButtonElement, previousLabel: string): void => {
	button.textContent = "Copied";

	setTimeout(() => Object.assign(button, {
		textContent: previousLabel,
		disabled: false,
		style: {
			cursor: "default"
		}
	}), 1000);
};

const copyPng = async (): Promise<void> => {
	const previousLabel = copyButton.textContent;
	showCopying(copyButton);

	const blob = await domToBlob(messagesElement(), { scale: pngScale, type: "image/png" });
	await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
	showCopied(copyButton, previousLabel);
};

const copyEmbedCode = async (): Promise<void> => {
	const previousLabel = embedButton.textContent;
	showCopying(embedButton);

	const parsed = parseEditor(editor.value);
	if (parsed.input === undefined) return;
	const { theme = "dark", platform = "desktop" } = selectedOptions();
	const fragment = await textToFragment(JSON.stringify(parsed.input));
	const url = new URL(`embed.html?${new URLSearchParams({ theme, platform })}#${fragment}`, location.href).href;
	const height = Math.ceil(messagesElement().getBoundingClientRect().height);
	await navigator.clipboard.writeText(embedCodeOf(url, Number(widthSelect.value), height));
	showCopied(embedButton, previousLabel);
};

const loadExample = (path: string): void => {
	editor.value = JSON.stringify(examples[path], undefined, "\t");
	renderPreview();
};

const reportFailure = (button: HTMLButtonElement, action: () => Promise<void>) => (): void => {
	const label = button.textContent;
	action().catch((error: unknown) => (status.textContent = `${label} failed: ${errorMessageOf(error)}`));
};

const examplePaths = Object.keys(examples).sort();
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
if (savedEditor === null) loadExample(firstVisitExample);
else {
	editor.value = savedEditor;
	renderPreview();
}
