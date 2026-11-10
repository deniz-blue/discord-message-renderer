export type Html = { readonly html: string };

export type HtmlValue = Html | string | number | undefined | false | readonly HtmlValue[];

const escapes: Record<string, string> = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
	"'": "&#39;",
};

export const escapeHtml = (text: string): string => text.replace(/[&<>"']/g, (char) => escapes[char] ?? char);

const isHtml = (value: HtmlValue): value is Html => typeof value === "object" && "html" in value;

const valueToHtml = (value: HtmlValue): string => {
	if (value === undefined || value === false) return "";
	if (Array.isArray(value)) return value.map(valueToHtml).join("");
	if (isHtml(value)) return value.html;
	return escapeHtml(String(value));
};

export const html = (strings: TemplateStringsArray, ...values: readonly HtmlValue[]): Html => ({
	html: strings.reduce((out, part, index) => out + valueToHtml(values[index - 1]) + part),
});

const safeUrlPattern = /^(https?:\/\/|data:image\/(png|jpeg|gif|webp);base64,)/i;

export const safeUrl = (url: string | undefined): string | undefined =>
	url !== undefined && safeUrlPattern.test(url) ? url : undefined;

export const safeColor = (color: string | number | undefined): string | undefined => {
	if (typeof color === "number") return `#${color.toString(16).padStart(6, "0")}`;
	return color !== undefined && /^#[0-9a-f]{3,8}$/i.test(color) ? color : undefined;
};
