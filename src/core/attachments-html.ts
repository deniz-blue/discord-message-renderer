import { type Html, html, safeUrl } from "./html.ts";
import type { AttachmentInput } from "./input.ts";

export type MediaItem = { url: string | undefined; description?: string | null | undefined; spoiler?: boolean | undefined };

// Discord's mosaic for two to ten items, measured from its app: rows of one, two or three, three items as one big and two stacked.
const mosaicRows: Record<number, readonly number[]> = {
	2: [2],
	4: [2, 2],
	5: [2, 3],
	6: [3, 3],
	7: [1, 3, 3],
	8: [2, 3, 3],
	9: [3, 3, 3],
	10: [1, 3, 3, 3],
};

const cellStyle = (perRow: number, count: number): string => {
	const aspect = perRow === 3 ? "1" : perRow === 1 || count === 4 ? "3 / 2" : "3 / 4";
	return `grid-column: span ${6 / perRow}; aspect-ratio: ${aspect}`;
};

const mosaicLayout = (count: number): { kind: string; cells: readonly string[] } => {
	if (count <= 1) return { kind: "single", cells: [""] };
	if (count === 3) return { kind: "three", cells: ["", "", ""] };
	const rows = mosaicRows[count] ?? mosaicRows[10] ?? [];
	return { kind: "mosaic", cells: rows.flatMap((perRow) => Array.from({ length: perRow }, () => cellStyle(perRow, count))) };
};

export const mediaMosaicToHtml = (media: readonly MediaItem[]): Html => {
	const items = media.slice(0, 10);
	const layout = mosaicLayout(items.length);
	return html`<div class="gallery ${layout.kind}">${items.map((item, index) => html`<img class="${item.spoiler === true ? "spoiler-media" : ""}" style="${layout.cells[index]}" src="${safeUrl(item.url)}" alt="${item.description ?? ""}">`)}</div>`;
};

const sizeUnits = ["KB", "MB", "GB"];

// Discord writes sizes in binary units with two decimals: "1.50 KB".
const formatFileSize = (bytes: number): string => {
	if (bytes < 1024) return `${bytes} bytes`;
	const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizeUnits.length);
	return `${(bytes / 1024 ** exponent).toFixed(2)} ${sizeUnits[exponent - 1]}`;
};

const fileIcon = html`<svg class="file-icon" viewBox="0 0 30 40" aria-hidden="true"><path fill="var(--background-mod-strong, #5d5f69)" d="M0 3a3 3 0 0 1 3-3h17l10 10v27a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3Z"/><path fill="var(--text-muted)" d="M20 0l10 10h-7a3 3 0 0 1-3-3Z"/></svg>`;

const downloadIcon = html`<svg class="file-download" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a1 1 0 0 1 1 1v10.59l3.3-3.3a1 1 0 1 1 1.4 1.42l-5 5a1 1 0 0 1-1.4 0l-5-5a1 1 0 1 1 1.4-1.42l3.3 3.3V3a1 1 0 0 1 1-1ZM3 20a1 1 0 1 0 0 2h18a1 1 0 1 0 0-2H3Z"/></svg>`;

export const fileCardToHtml = (name: string, size: number | undefined): Html =>
	html`<div class="file">${fileIcon}<div class="file-text"><div class="file-name">${name}</div>${size === undefined ? false : html`<div class="file-size">${formatFileSize(size)}</div>`}</div>${downloadIcon}</div>`;

const imagePattern = /\.(png|jpe?g|gif|webp|avif)$/i;

const isImage = (attachment: AttachmentInput): boolean =>
	attachment.content_type?.startsWith("image/") ?? imagePattern.test(attachment.filename ?? "");

// Discord: a file whose name starts with SPOILER_ is sent as a spoiler.
const isSpoiler = (attachment: AttachmentInput): boolean => attachment.filename?.startsWith("SPOILER_") === true;

export const attachmentsToHtml = (attachments: readonly AttachmentInput[]): Html => {
	const images = attachments.filter(isImage);
	const files = attachments.filter((attachment) => !isImage(attachment));
	return html`${images.length === 0 ? false : html`<div class="attachments">${mediaMosaicToHtml(images.map((image) => ({ url: image.url, description: image.description, spoiler: isSpoiler(image) })))}</div>`}${files.map((file) => html`<div class="attachments">${fileCardToHtml((file.filename ?? "file").replace(/^SPOILER_/, ""), file.size)}</div>`)}`;
};
