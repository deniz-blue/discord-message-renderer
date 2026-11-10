import { emojiToHtml } from "./emoji.ts";
import { type Html, html } from "./html.ts";
import type { ReactionInput } from "./input.ts";

export const reactionsToHtml = (reactions: readonly ReactionInput[]): Html =>
	html`<div class="reactions">${reactions.map((reaction) => html`<div class="reaction${reaction.me === true ? " me" : ""}">${emojiToHtml(reaction.emoji)}<span class="reaction-count">${reaction.count ?? 1}</span></div>`)}</div>`;
