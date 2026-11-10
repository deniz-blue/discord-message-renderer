import { safeColor } from "./html.ts";
import type { ResolvedEntities, RoleInput, UserInput } from "./input.ts";

export const displayNameOf = (user: UserInput): string => user.global_name ?? user.username ?? "Unknown";

export const userNameOf = (id: string, resolved: ResolvedEntities): string | undefined => {
	const user = resolved.users?.[id];
	return resolved.members?.[id]?.nick ?? (user === undefined ? undefined : displayNameOf(user));
};

// Discord: a role colour of 0 means the role has none; `colors` replaces the deprecated `color`.
export const roleColorOf = (role: RoleInput | undefined): string | undefined => {
	const color = role?.colors?.primary_color ?? role?.color;
	return color === 0 ? undefined : safeColor(color);
};
