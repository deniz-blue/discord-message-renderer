import { ok } from "node:assert/strict";
import { test } from "node:test";
import { renderMessagesHtml } from "./render.ts";

const now = "2026-11-10T12:00:00Z";

test("image attachments share a mosaic and other files get a card with their size", () => {
	const html = renderMessagesHtml({
		messages: [{ attachments: [
			{ filename: "a.png", url: "https://example.com/a.png" },
			{ filename: "SPOILER_b.jpg", url: "https://example.com/b.jpg" },
			{ filename: "notes.pdf", size: 1536 },
		] }],
	}, {});
	ok(html.includes('<div class="gallery mosaic">'));
	ok(html.includes('class="spoiler-media"'));
	ok(html.includes('<div class="file-name">notes.pdf</div><div class="file-size">1.50 KB</div>'));
});

test("an open poll asks for a vote and counts down", () => {
	const html = renderMessagesHtml({
		context: { now },
		messages: [{ poll: { question: { text: "?" }, answers: [{ answer_id: 1, poll_media: { text: "yes" } }], expiry: "2026-11-11T11:00:00Z" } }],
	}, {});
	ok(html.includes('<span class="poll-choice"></span>'));
	ok(html.includes("<span>23h left</span>"));
});

test("a finished poll shows shares and marks the winner and my vote", () => {
	const html = renderMessagesHtml({
		context: { now },
		messages: [{ poll: {
			answers: [{ answer_id: 1, poll_media: { text: "a" } }, { answer_id: 2, poll_media: { text: "b" } }],
			results: { is_finalized: true, answer_counts: [{ id: 1, count: 3, me_voted: false }, { id: 2, count: 1, me_voted: true }] },
		} }],
	}, {});
	ok(html.includes('class="poll-answer victor" style="--share:75%"'));
	ok(html.includes('class="poll-answer voted" style="--share:25%"'));
	ok(html.includes("<span>Poll closed</span>"));
});

test("reactions show their count and whether I reacted", () => {
	const html = renderMessagesHtml({ messages: [{ reactions: [{ emoji: { id: null, name: "👍" }, count: 2, me: true }] }] }, {});
	ok(html.includes('<div class="reaction me">'));
	ok(html.includes('<span class="reaction-count">2</span>'));
});

test("a command reply names who used it and an ephemeral one says only they can see it", () => {
	const html = renderMessagesHtml({
		messages: [{ flags: 64, interaction: { name: "event new", user: { id: "3", global_name: "Organizer" } } }],
	}, {});
	ok(html.includes('<span class="command-name">/event new</span>'));
	ok(html.includes("<span>Only you can see this</span>"));
});
