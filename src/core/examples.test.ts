import { ok, strictEqual } from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import { type RenderInput, renderInputOf } from "./input.ts";
import { renderMessagesHtml } from "./render.ts";

const examplesFolder = new URL("../../examples/", import.meta.url);

const exampleInputOf = (name: string): RenderInput => renderInputOf(JSON.parse(readFileSync(new URL(name, examplesFolder), "utf8")));

const markerOfFeature: Record<string, string> = {
	"a role colour from context.members": 'class="author-name" style="color:#a97dff">deniz',
	"a role colour from the message's member": 'class="author-name" style="color:#eb459f">Pixel',
	"an avatar hash": "/avatars/684259561846079524/6a090d3694c90db98fd8fb805778daff.png",
	"a grouped message": 'class="message grouped"',
	"a reply to an earlier message": 'class="reply-text">Heading<',
	"a reply to a referenced_message": "a message from before this list",
	"a slash command": '<span class="command-name">/event show</span>',
	"an ephemeral note": 'class="ephemeral-note"',
	"the APP tag": 'class="app-tag"',
	"an app called Bot": ">Bot</span>",
	"an edit": 'class="edited"',
	"headings": 'class="heading h3"',
	"subtext": 'class="subtext"',
	"a quote": 'class="quote"',
	"a nested list": 'class="list-marker circle"',
	"a numbered list": 'class="list-marker">2.',
	"a spoiler": 'class="spoiler"',
	"inline code": 'class="inline-code"',
	"a highlighted code block": 'class="hljs-keyword"',
	"a named link": ">a named link</a>",
	"a role mention": 'class="mention colored"',
	"a channel mention": ">#general</span>",
	"a command mention": ">/render</span>",
	"a mention from mentions": ">@Toast</span>",
	"a timestamp": 'class="timestamp">in 3 days',
	"a Twemoji": "@twemoji/svg",
	"a custom emoji": "/emojis/1030440120433790996.webp",
	"an animated emoji": "/emojis/800148287185223701.gif",
	"an embed author": 'class="embed-author"',
	"an embed title link": 'class="embed-title link"',
	"an inline embed field": 'class="embed-field inline"',
	"an embed image": 'class="embed-image"',
	"an embed thumbnail": 'class="embed-thumbnail"',
	"an embed footer": 'class="embed-footer"',
	"every button style": 'class="button danger"',
	"a link button": 'class="link-icon"',
	"a disabled button": 'class="button primary disabled"',
	"a string select with a default": 'class="select chosen"',
	"a disabled select": 'class="select disabled"',
	"a container": 'class="container accented"',
	"a section accessory": 'class="section-accessory"',
	"a thumbnail": 'class="thumbnail"',
	"a media gallery": 'class="gallery three"',
	"a spoiler image": 'class="spoiler-media"',
	"a file": '<div class="file-name">notes.txt</div>',
	"a file attachment": '<div class="file-name">house-rules.pdf</div>',
	"a divider": 'class="separator divider"',
	"a large separator": 'class="separator large"',
	"a sticker": 'class="sticker"',
	"a Lottie sticker": "sticker Hello",
	"an open poll": 'class="poll-choice checkbox"',
	"a finished poll": 'class="poll-answer victor"',
	"my vote": 'class="poll-answer voted"',
	"my reaction": 'class="reaction me"',
};

test("every example renders each of its messages", () => {
	for (const name of readdirSync(examplesFolder)) {
		const input = exampleInputOf(name);
		const html = renderMessagesHtml(input, {});
		strictEqual(html.match(/class="message[ "]/g)?.length ?? 0, input.messages.length, name);
	}
});

test("the everything example shows every feature", () => {
	const html = renderMessagesHtml(exampleInputOf("5-everything.json"), {});
	for (const [feature, marker] of Object.entries(markerOfFeature)) ok(html.includes(marker), `missing ${feature}`);
});
