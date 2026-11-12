import { ok } from "node:assert/strict";
import { test } from "node:test";
import { renderMessagesHtml } from "./render.ts";

const viewer = "1000000000000000001";
const someoneElse = "1000000000000000002";

test("a message that mentions the viewer is highlighted", () => {
	for (const message of [
		{ content: `hi <@${viewer}>` },
		{ content: `hi <@!${viewer}>` },
		{ mentions: [{ id: viewer }] },
		{ mention_everyone: true },
	]) {
		const html = renderMessagesHtml({ context: { viewer }, messages: [message] }, {});
		ok(html.includes('class="message mentioned"'), JSON.stringify(message));
	}
});

test("a message that mentions one of the viewer's roles is highlighted", () => {
	const members = { [viewer]: { roles: ["5"] } };
	for (const message of [{ content: "hi <@&5>" }, { mention_roles: ["5"] }]) {
		const html = renderMessagesHtml({ context: { viewer, members }, messages: [message] }, {});
		ok(html.includes('class="message mentioned"'), JSON.stringify(message));
	}
	const other = renderMessagesHtml({ context: { viewer, members }, messages: [{ content: "hi <@&6>" }] }, {});
	ok(!other.includes("mentioned"));
});

test("a message that mentions someone else is not highlighted", () => {
	const html = renderMessagesHtml({ context: { viewer }, messages: [{ content: `hi <@${someoneElse}>` }] }, {});
	ok(!html.includes("mentioned"));
});

test("nothing is highlighted without a viewer", () => {
	const html = renderMessagesHtml({ messages: [{ content: `hi <@${viewer}>`, mention_everyone: true }] }, {});
	ok(!html.includes("mentioned"));
});

test("a grouped message keeps its highlight", () => {
	const html = renderMessagesHtml({
		context: { viewer },
		messages: [
			{ author: { id: someoneElse }, timestamp: "2026-11-10T12:00:00Z", content: "first" },
			{ author: { id: someoneElse }, timestamp: "2026-11-10T12:01:00Z", content: `then <@${viewer}>` },
		],
	}, {});
	ok(html.includes('class="message grouped mentioned"'));
});

test("an ephemeral message is blurple, even when it mentions the viewer", () => {
	const html = renderMessagesHtml({ context: { viewer }, messages: [{ flags: 64, content: `<@${viewer}>` }] }, {});
	ok(html.includes('class="message ephemeral"'));
	ok(!html.includes("mentioned"));
});

test("an ephemeral message is blurple without a viewer", () => {
	const html = renderMessagesHtml({ messages: [{ flags: 64, content: "only me" }] }, {});
	ok(html.includes('class="message ephemeral"'));
});
