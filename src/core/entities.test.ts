import { strictEqual } from "node:assert/strict";
import { test } from "node:test";
import { roleColorOf, userNameOf } from "./entities.ts";
import { settingsOf } from "./input.ts";

test("a mention shows the member's nick, then the user's display name", () => {
	const resolved = { users: { "1": { username: "a", global_name: "A" }, "2": { username: "b" } }, members: { "1": { nick: "nick" } } };
	strictEqual(userNameOf("1", resolved), "nick");
	strictEqual(userNameOf("2", resolved), "b");
	strictEqual(userNameOf("3", resolved), undefined);
});

test("authors and mentioned users, with their members, count as resolved", () => {
	const { resolved } = settingsOf({
		messages: [{ author: { id: "1", username: "a" }, member: { nick: "author" }, mentions: [{ id: "2", username: "b", member: { nick: "mentioned" } }] }],
	}, "desktop");
	strictEqual(userNameOf("1", resolved), "author");
	strictEqual(userNameOf("2", resolved), "mentioned");
});

test("a role's colour is its primary colour, then the old colour, and 0 is none", () => {
	strictEqual(roleColorOf({ color: 0x111111, colors: { primary_color: 0x222222, secondary_color: null, tertiary_color: null } }), "#222222");
	strictEqual(roleColorOf({ color: 0x111111 }), "#111111");
	strictEqual(roleColorOf({ color: 0 }), undefined);
});
