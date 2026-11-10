import hljs from "highlight.js/lib/common";
import { type Html, html } from "./html.ts";

export const highlightCode = (text: string, language: string | undefined): Html =>
	language !== undefined && hljs.getLanguage(language) !== undefined
		? { html: hljs.highlight(text, { language, ignoreIllegals: true }).value }
		: html`${text}`;
