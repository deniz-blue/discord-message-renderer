# discord-message-renderer

Renders Discord messages from API JSON as a PNG, JPEG, WebP, GIF, HTML or an embed: https://discord-message-renderer.tsx.lt

## CLI

```sh
node src/cli.ts input.json -o out.png|out.jpeg|out.webp|out.gif [--html out.html] [--width 600] [--scale 2]
    [--theme dark|ash|onyx|light] [--platform desktop|mobile] [--font "Google font"] [--fonts dir] [--fps 30] [--duration 10000]
```

- Needs Node 26
- `--fonts`: a folder of font files, e.g. gg sans (not included)

## Embedding

- Copy embed code on the site gives an iframe snippet
- Or post messages to the iframe:

```js
frame.contentWindow.postMessage({
	type: "discord-message-renderer:render",
	input: { messages: [/* … */] },
	options: { theme: "ash", platform: "mobile" },
}, "*");
```

- Events posted back:
  - `discord-message-renderer:ready`
  - `discord-message-renderer:height` with `height`
  - `discord-message-renderer:error` with `message`

## Input format

```json
{
	"context": {
		"users": { "3": { "id": "3", "username": "organizer", "global_name": "Organizer" } },
		"roles": { "5": { "id": "5", "name": "Testers", "color": 15418783, "position": 2 } },
		"channels": { "2": { "id": "2", "name": "events" } },
		"now": "2026-11-10T09:50:00+02:00",
		"timeZone": "Europe/Vilnius",
		"viewer": "3",
		"locale": "en-US"
	},
	"messages": [
		{
			"id": "1",
			"author": { "id": "684259561846079524", "username": "ProtoCal", "avatar": "6a090d3694c90db98fd8fb805778daff", "bot": true },
			"timestamp": "2026-11-10T09:45:00+02:00",
			"content": "hi <@3>"
		}
	]
}
```

The top level is `{ context, messages }`, or a single message object. Every field is optional.

### `messages`

Discord message objects, as the API returns them:

- `id`: lets a later message reply to this one
- `author`: `id`, `username`, `global_name`, `avatar` (a hash or an image URL), `bot`. Without one, the author is an app
  called Bot
- `member`: `nick`, and `roles` as ids. The name takes the colour of the highest role in `context.roles` that has one.
  Without it, `context.members` is looked up by author id
- `webhook_id`: adds the APP tag, as `author.bot` does
- `timestamp`: defaults to `context.now`. The same author within 7 minutes is grouped
- `edited_timestamp`: adds "(edited)"
- `message_reference` + `referenced_message`, or a `message_id` of an earlier message: drawn as a reply. Forwards are
  ignored
- `mentions`: these users, and their `member`, need no entry in `context`
- `interaction`: `name`, `user`, `member`. Drawn above the message as "X used /name"
- `flags`: 64 (ephemeral) adds "Only you can see this", and a blurple bar and faint tint across the message
- `content`: markdown, see below
- `embeds`: `author` (`name`, `icon_url`), `title`, `url`, `description`, `fields` (`name`, `value`, `inline`),
  `image.url`, `thumbnail.url`, `footer` (`text`, `icon_url`), `timestamp`, `color`
- `components`:
  - action row, button (`style`, `label`, `emoji`, `disabled`)
  - string, user, role, mentionable and channel selects (`placeholder`, `disabled`, and `default` options of a string
    select)
  - container (`accent_color`), section (`accessory`), text display, thumbnail (`media.url`, `description`)
  - media gallery (up to 10 `items`: `media.url`, `description`, `spoiler`), file (`file.url`), separator (`spacing`,
    `divider`)
- `attachments`: images (by `content_type` or extension) share one mosaic; other files get a card with `filename` and
  `size`. A `SPOILER_` name blurs the image
- `sticker_items`: `id`, `name`, `format_type`. PNG, APNG and GIF are drawn; Lottie shows its name
- `poll`: `question.text`, `answers` (`answer_id`, `poll_media.text`, `poll_media.emoji`), `expiry`, `allow_multiselect`,
  `results` (`is_finalized`, `answer_counts`: `id`, `count`, `me_voted`). Shares show once it is finalized, expired, or
  voted on
- `reactions`: `emoji`, `count`, `me`

### `context`

Partial API objects keyed by id, as in an interaction's `resolved`:

- `users`: `global_name`, then `username`
- `members`: `nick`, `roles`
- `roles`: `name`, `colors.primary_color` or `color` (0 means none), `position`
- `channels`: `name`
- `now`: ISO time for "Today at" and relative timestamps. Defaults to the current time
- `timeZone`: IANA name, defaults to `UTC`
- `viewer`: the user id of the person reading. A message that mentions them (`mentions`, `<@id>`, `@everyone`, or a role
  they have in `context.members`) gets a gold bar and a faint tint. Without it, no message gets that look
- `locale`: defaults to `en-US`

A user mention shows the member's `nick`, then the user's name, then its id.

### Markdown

In `content`, text displays, and embed titles, descriptions and fields:

- `**bold**`, `*italic*`, `_italic_`, `__underline__`, `~~strike~~`, `||spoiler||`, `` `code` ``
- code blocks (highlighted), `>` and `>>>` quotes, `#` `##` `###` headings, `-#` subtext, `-` `*` `1.` lists
- links: bare, `<url>`, `[text](url)`
- `<@id>`, `<@&id>`, `<#id>`, `@everyone`, `@here`, `</command:id>`
- `<t:seconds:style>` timestamps
- Unicode emoji (as Twemoji), `<:name:id>` and `<a:name:id>`
