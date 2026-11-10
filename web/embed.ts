import "../src/core/style.css";
import "../src/core/themes.css";
import { isRecord, renderInputOf } from "../src/core/input.ts";
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
import { type EmbedEvent, type RenderRequest, embedEventTypes, renderRequestType } from "./embed-protocol.ts";
import "./embed.css";
import { fragmentToText } from "./fragment.ts";

const messages = elementById("messages", HTMLDivElement);
const fontLink = elementById("font", HTMLLinkElement);

type OptionReader = (name: keyof RenderOptions) => string | undefined;

const readOptions = (read: OptionReader): RenderOptions => {
	const theme = matchingOption(themes, read("theme"));
	const platform = matchingOption(platforms, read("platform"));
	const font = read("font");
	return {
		...(theme === undefined ? {} : { theme }),
		...(platform === undefined ? {} : { platform }),
		...(font === undefined ? {} : { font }),
	};
};

const query = new URLSearchParams(location.search);
const queryOptions = readOptions((name) => query.get(name) ?? undefined);

const isRenderRequest = (value: unknown): value is RenderRequest => isRecord(value) && value["type"] === renderRequestType;

const requestedOptions = (request: RenderRequest): RenderOptions => {
	const options: Record<string, unknown> = isRecord(request.options) ? request.options : {};
	return readOptions((name) => {
		const value = options[name];
		return typeof value === "string" ? value : undefined;
	});
};

const postToHost = (event: EmbedEvent): void => parent.postMessage(event, "*");

const errorMessageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error));

const showError = (message: string): void => {
	messages.replaceChildren(Object.assign(document.createElement("p"), { className: "embed-error", textContent: message }));
	postToHost({ type: embedEventTypes.error, message });
};

const draw = (input: unknown, options: RenderOptions): void => {
	try {
		const html = renderMessagesHtml(renderInputOf(input), options);
		fontLink.href = fontStylesheetUrl(fontOf(options));
		messages.innerHTML = html;
	} catch (error) {
		showError(errorMessageOf(error));
	}
};

const drawFragment = async (): Promise<void> => {
	const fragment = location.hash.slice(1);
	if (fragment === "") return;
	try {
		draw(JSON.parse(await fragmentToText(fragment)), queryOptions);
	} catch (error) {
		showError(`The link's messages could not be read: ${errorMessageOf(error)}`);
	}
};

addEventListener("message", (event) => {
	if (event.source !== parent || !isRenderRequest(event.data)) return;
	draw(event.data.input, { ...queryOptions, ...requestedOptions(event.data) });
});
addEventListener("hashchange", () => void drawFragment());
new ResizeObserver(() => postToHost({ type: embedEventTypes.height, height: Math.ceil(messages.getBoundingClientRect().height) })).observe(messages);

await drawFragment();
postToHost({ type: embedEventTypes.ready });
