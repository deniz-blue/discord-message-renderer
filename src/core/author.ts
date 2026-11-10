import { displayNameOf, roleColorOf } from "./entities.ts";
import { safeUrl } from "./html.ts";
import type { MessageInput, ResolvedEntities, UserInput } from "./input.ts";

export type Author = {
	key: string;
	name: string;
	avatarUrl: string;
	color: string | undefined;
	app: boolean;
};

const cdn = "https://cdn.discordapp.com";
const bot: UserInput = { username: "Bot", bot: true };

// Discord: users on unique usernames get default avatar (id >> 22) % 6.
const defaultAvatarIndexOf = (user: UserInput): number =>
	user.id !== undefined && /^\d+$/.test(user.id)
		? Number((BigInt(user.id) >> 22n) % 6n)
		: [...displayNameOf(user)].reduce((sum, char) => sum + (char.codePointAt(0) ?? 0), 0) % 6;

const avatarUrlOf = (user: UserInput): string => {
	const avatar = user.avatar ?? undefined;
	if (avatar?.startsWith("https://") === true) return safeUrl(avatar) ?? `${cdn}/embed/avatars/0.png`;
	if (avatar !== undefined && /^(a_)?[0-9a-f]+$/.test(avatar) && /^\d+$/.test(user.id ?? "")) {
		return `${cdn}/avatars/${user.id}/${avatar}.${avatar.startsWith("a_") ? "gif" : "png"}?size=80`;
	}
	return `${cdn}/embed/avatars/${defaultAvatarIndexOf(user)}.png`;
};

type ColoredRole = { color: string; position: number };

// Discord colours a name with the highest-positioned role that has a colour.
const nameColorOf = (roleIds: readonly string[], resolved: ResolvedEntities): string | undefined =>
	roleIds
		.flatMap((id): ColoredRole[] => {
			const role = resolved.roles?.[id];
			const color = roleColorOf(role);
			return color === undefined ? [] : [{ color, position: role?.position ?? 0 }];
		})
		.reduce<ColoredRole | undefined>((best, role) => (best === undefined || role.position > best.position ? role : best), undefined)
		?.color;

export const authorOf = (message: MessageInput, resolved: ResolvedEntities): Author => {
	const user = message.author ?? bot;
	const member = message.member ?? (user.id === undefined ? undefined : resolved.members?.[user.id]);
	return {
		key: user.id ?? displayNameOf(user),
		name: member?.nick ?? displayNameOf(user),
		avatarUrl: avatarUrlOf(user),
		color: nameColorOf(member?.roles ?? [], resolved),
		app: user.bot === true || message.webhook_id !== undefined,
	};
};
