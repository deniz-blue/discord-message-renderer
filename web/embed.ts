import { errorMessageOf } from "../src/core/errors.ts";
import { isRecord, renderInputOf } from "../src/core/input.ts";
import { type RenderOptions, renderOptionsOf } from "../src/core/options.ts";
import { elementById } from "./elements.ts";
import { type EmbedEvent, type RenderRequest, embedEventTypes, renderRequestType } from "./embed-protocol.ts";
import "./embed.css";
import { fragmentToText } from "./fragment.ts";
import { showMessages } from "./show-messages.ts";

const messages = elementById("messages", HTMLDivElement);
const fontLink = elementById("font", HTMLLinkElement);
const query = new URLSearchParams(location.search);

type RequestedOptions = Partial<Record<keyof RenderOptions, unknown>>;

const isRenderRequest = (value: unknown): value is RenderRequest => isRecord(value) && value["type"] === renderRequestType;

const postToHost = (event: EmbedEvent): void => parent.postMessage(event, "*");

const showError = (message: string): void => {
	messages.replaceChildren(Object.assign(document.createElement("p"), { className: "embed-error", textContent: message }));
	postToHost({ type: embedEventTypes.error, message });
};

const draw = (input: unknown, requested: RequestedOptions): void => {
	try {
		const options = renderOptionsOf((name) => {
			const value = requested[name];
			return typeof value === "string" ? value : (query.get(name) ?? undefined);
		});
		showMessages(messages, fontLink, renderInputOf(input), options);
	} catch (error) {
		showError(errorMessageOf(error));
	}
};

const drawFragment = async (): Promise<void> => {
	const fragment = location.hash.slice(1);
	if (fragment === "") return;
	try {
		draw(JSON.parse(await fragmentToText(fragment)), {});
	} catch (error) {
		showError(`The link's messages could not be read: ${errorMessageOf(error)}`);
	}
};

addEventListener("message", (event) => {
	if (event.source !== parent || !isRenderRequest(event.data)) return;
	draw(event.data.input, isRecord(event.data.options) ? event.data.options : {});
});
addEventListener("hashchange", () => void drawFragment());
new ResizeObserver(() => postToHost({ type: embedEventTypes.height, height: Math.ceil(messages.getBoundingClientRect().height) })).observe(messages);

await drawFragment();
postToHost({ type: embedEventTypes.ready });
