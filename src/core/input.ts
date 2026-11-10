import type { APIMessage, APIUser } from "discord-api-types/v10";
import { displayNameOf } from "./author.ts";
import type { Clock } from "./timestamp.ts";

export type UserInput = Partial<Pick<APIUser, "id" | "username" | "global_name" | "avatar" | "bot">>;

export type MemberInput = { nick?: string | null; roles?: string[] };

export type MessageInput = Partial<Omit<APIMessage, "author" | "mentions" | "referenced_message">> & {
	author?: UserInput;
	member?: MemberInput;
	mentions?: UserInput[];
	referenced_message?: MessageInput | null;
};

export type RoleInput = { name: string; color?: string | number; position?: number };

export type MentionNames = {
	users?: Record<string, string>;
	roles?: Record<string, RoleInput>;
	channels?: Record<string, string>;
};

export type RenderContext = MentionNames & {
	now?: string;
	timeZone?: string;
	locale?: string;
};

export type RenderInput = {
	context?: RenderContext;
	messages: MessageInput[];
};

export type Theme = "dark" | "ash" | "onyx" | "light";

export type Platform = "desktop" | "mobile";

export type RenderOptions = {
	theme?: Theme;
	platform?: Platform;
	font?: string;
};

export type RenderSettings = Clock & { names: MentionNames; platform: Platform };

const usersNamedIn = (messages: readonly MessageInput[]): Record<string, string> =>
	Object.fromEntries(
		messages
			.flatMap((message) => [message.author, ...(message.mentions ?? [])])
			.flatMap((user) => (user?.id === undefined ? [] : [[user.id, displayNameOf(user)]])),
	);

export const settingsOf = (input: RenderInput, options: RenderOptions): RenderSettings => {
	const context = input.context ?? {};
	return {
		names: { ...context, users: { ...usersNamedIn(input.messages), ...context.users } },
		platform: options.platform ?? "desktop",
		locale: context.locale ?? "en-US",
		timeZone: context.timeZone ?? "UTC",
		now: context.now === undefined ? new Date() : new Date(context.now),
	};
};

export const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

export const renderInputOf = (json: unknown): RenderInput => {
	if (!isRecord(json)) throw new Error("Expected an object: a message, or { \"messages\": [...] }");
	return Array.isArray(json["messages"]) ? (json as RenderInput) : { messages: [json as MessageInput] };
};
