import { strictEqual } from "node:assert/strict";
import { test } from "node:test";
import { fragmentToText, textToFragment } from "./fragment.ts";

test("text survives the trip through a URL fragment", async () => {
	const text = JSON.stringify({ messages: [{ content: "héllo 🎨 <@3> & more ".repeat(20) }] });
	const fragment = await textToFragment(text);
	strictEqual(/^[\w-]+$/.test(fragment), true);
	strictEqual(fragment.length < text.length, true);
	strictEqual(await fragmentToText(fragment), text);
});
