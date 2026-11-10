import { deepStrictEqual, strictEqual } from "node:assert/strict";
import { test } from "node:test";
import { authorOf } from "./author.ts";

const roles = { "1": { name: "low", color: 0x111111, position: 1 }, "2": { name: "high", color: 0x222222, position: 5 }, "3": { name: "plain", color: 0, position: 9 } };

test("a message without an author is from an app called Bot", () => {
	const author = authorOf({ content: "hi" }, {});
	deepStrictEqual([author.name, author.app], ["Bot", true]);
});

test("the name is the nick, then the global name, then the username", () => {
	strictEqual(authorOf({ author: { username: "a", global_name: "A" }, member: { nick: "nick" } }, {}).name, "nick");
	strictEqual(authorOf({ author: { username: "a", global_name: "A" } }, {}).name, "A");
	strictEqual(authorOf({ author: { username: "a", global_name: null } }, {}).name, "a");
});

test("the highest coloured role colours the name", () => {
	strictEqual(authorOf({ author: { username: "a" }, member: { roles: ["1", "2", "3"] } }, { roles }).color, "#222222");
	strictEqual(authorOf({ author: { username: "a" }, member: { roles: ["3"] } }, { roles }).color, undefined);
});

test("avatars come from the hash, or the default for the id", () => {
	strictEqual(authorOf({ author: { id: "684259561846079524", avatar: "6a09" } }, {}).avatarUrl, "https://cdn.discordapp.com/avatars/684259561846079524/6a09.png?size=80");
	strictEqual(authorOf({ author: { id: String(5n << 22n), avatar: null } }, {}).avatarUrl, "https://cdn.discordapp.com/embed/avatars/5.png");
});

test("webhook messages carry the app tag", () => {
	strictEqual(authorOf({ author: { username: "hook" }, webhook_id: "7" }, {}).app, true);
});
