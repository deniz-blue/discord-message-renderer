import type {
	APIAttachment,
	APIChannel,
	APIGuildMember,
	APIMessage,
	APIPoll,
	APIPollAnswer,
	APIPollAnswerCount,
	APIPollMedia,
	APIReaction,
	APIRole,
	APIStickerItem,
	APIUser,
} from "discord-api-types/v10";
import type { EmojiInput } from "./emoji.ts";
import type { Platform } from "./options.ts";
import type { Clock } from "./timestamp.ts";

export type UserInput = Partial<APIUser>;

export type MemberInput = Partial<Omit<APIGuildMember, "user">>;

export type RoleInput = Partial<APIRole>;

export type ChannelInput = Partial<Pick<APIChannel, "id" | "name" | "type">>;

export type MentionedUserInput = UserInput & { member?: MemberInput };

export type AttachmentInput = Partial<APIAttachment>;

export type ReactionInput = Partial<Omit<APIReaction, "emoji">> & { emoji?: EmojiInput };

export type StickerInput = Partial<APIStickerItem>;

export type PollAnswerInput = Partial<Omit<APIPollAnswer, "poll_media">> & { poll_media?: Partial<APIPollMedia> };

export type PollInput = Partial<Omit<APIPoll, "question" | "answers" | "results">> & {
	question?: Partial<APIPollMedia>;
	answers?: PollAnswerInput[];
	results?: { is_finalized?: boolean; answer_counts?: Partial<APIPollAnswerCount>[] };
};

export type InteractionInput = { name?: string; user?: UserInput; member?: MemberInput };

type InputFields = "author" | "mentions" | "referenced_message" | "attachments" | "reactions" | "sticker_items" | "poll" | "interaction";

export type MessageInput = Partial<Omit<APIMessage, InputFields>> & {
	author?: UserInput;
	member?: MemberInput;
	mentions?: MentionedUserInput[];
	referenced_message?: MessageInput | null;
	attachments?: AttachmentInput[];
	reactions?: ReactionInput[];
	sticker_items?: StickerInput[];
	poll?: PollInput;
	interaction?: InteractionInput;
};

export type ResolvedEntities = {
	users?: Record<string, UserInput>;
	members?: Record<string, MemberInput>;
	roles?: Record<string, RoleInput>;
	channels?: Record<string, ChannelInput>;
};

export type RenderContext = ResolvedEntities & {
	now?: string;
	timeZone?: string;
	locale?: string;
};

export type RenderInput = {
	context?: RenderContext;
	messages: MessageInput[];
};

export type RenderSettings = Clock & { resolved: ResolvedEntities; platform: Platform };

const usersIn = (messages: readonly MessageInput[]): Record<string, UserInput> =>
	Object.fromEntries(
		messages
			.flatMap((message) => [message.author, ...(message.mentions ?? [])])
			.flatMap((user) => (user?.id === undefined ? [] : [[user.id, user]])),
	);

const membersIn = (messages: readonly MessageInput[]): Record<string, MemberInput> =>
	Object.fromEntries(
		messages
			.flatMap((message) => [
				[message.author?.id, message.member] as const,
				...(message.mentions ?? []).map((user) => [user.id, user.member] as const),
			])
			.flatMap(([id, member]) => (id === undefined || member === undefined ? [] : [[id, member]])),
	);

export const settingsOf = (input: RenderInput, platform: Platform): RenderSettings => {
	const { now, timeZone, locale, ...resolved } = input.context ?? {};
	return {
		resolved: {
			...resolved,
			users: { ...usersIn(input.messages), ...resolved.users },
			members: { ...membersIn(input.messages), ...resolved.members },
		},
		platform,
		locale: locale ?? "en-US",
		timeZone: timeZone ?? "UTC",
		now: now === undefined ? new Date() : new Date(now),
	};
};

export const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

export const renderInputOf = (json: unknown): RenderInput => {
	if (!isRecord(json)) throw new Error("Expected an object: a message, or { \"messages\": [...] }");
	return Array.isArray(json["messages"]) ? (json as RenderInput) : { messages: [json as MessageInput] };
};
