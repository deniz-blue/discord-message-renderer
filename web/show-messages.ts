import "../src/core/style.css";
import "../src/core/themes.css";
import type { RenderInput } from "../src/core/input.ts";
import { type RenderOptions, fontOf, fontStylesheetUrl } from "../src/core/options.ts";
import { renderMessagesHtml } from "../src/core/render.ts";

export const showMessages = (target: HTMLElement, fontLink: HTMLLinkElement, input: RenderInput, options: RenderOptions): void => {
	target.innerHTML = renderMessagesHtml(input, options);
	fontLink.href = fontStylesheetUrl(fontOf(options));
};
