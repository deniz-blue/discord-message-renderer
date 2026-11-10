import { emojiToHtml } from "./emoji.ts";
import { type Html, html } from "./html.ts";
import type { PollAnswerInput, PollInput, RenderSettings } from "./input.ts";

type AnswerResult = { count: number; meVoted: boolean };

type PollState = {
	results: ReadonlyMap<number, AnswerResult>;
	total: number;
	most: number;
	closed: boolean;
	showsResults: boolean;
};

const votesText = (count: number): string => `${count} ${count === 1 ? "vote" : "votes"}`;

// Discord counts down in whole days, then hours, then minutes: "6d left", "23h left", "45m left".
const timeLeftOf = (expiry: Date, now: Date): string => {
	const minutes = Math.max(1, Math.ceil((expiry.getTime() - now.getTime()) / 60_000));
	if (minutes >= 1440) return `${Math.floor(minutes / 1440)}d left`;
	if (minutes >= 60) return `${Math.floor(minutes / 60)}h left`;
	return `${minutes}m left`;
};

const pollStateOf = (poll: PollInput, expiry: Date | undefined, now: Date): PollState => {
	const results = new Map((poll.results?.answer_counts ?? []).map((answer) => [answer.id ?? -1, { count: answer.count ?? 0, meVoted: answer.me_voted === true }]));
	const counts = [...results.values()].map((result) => result.count);
	const closed = poll.results?.is_finalized === true || (expiry !== undefined && expiry <= now);
	return {
		results,
		total: counts.reduce((sum, count) => sum + count, 0),
		most: Math.max(0, ...counts),
		closed,
		showsResults: closed || [...results.values()].some((result) => result.meVoted),
	};
};

const answerToHtml = (answer: PollAnswerInput, poll: PollInput, state: PollState): Html => {
	const media = html`${emojiToHtml(answer.poll_media?.emoji)}<span class="poll-answer-label">${answer.poll_media?.text ?? ""}</span>`;
	if (!state.showsResults) {
		return html`<div class="poll-answer">${media}<span class="poll-choice${poll.allow_multiselect === true ? " checkbox" : ""}"></span></div>`;
	}
	const result = state.results.get(answer.answer_id ?? -1) ?? { count: 0, meVoted: false };
	const won = state.closed && state.most > 0 && result.count === state.most;
	const share = state.total === 0 ? 0 : Math.round((result.count / state.total) * 100);
	return html`<div class="poll-answer${won ? " victor" : result.meVoted ? " voted" : ""}" style="--share:${share}%">${media}<span class="poll-votes">${votesText(result.count)}<strong>${share}%</strong></span></div>`;
};

const actionsToHtml = (state: PollState): Html => {
	if (!state.showsResults) return html`<span class="poll-action">Show results</span><span class="button primary disabled">Vote</span>`;
	return state.closed ? html`` : html`<span class="poll-action">Remove Vote</span>`;
};

export const pollToHtml = (poll: PollInput, settings: RenderSettings): Html => {
	const expiry = poll.expiry === undefined || poll.expiry === null ? undefined : new Date(poll.expiry);
	const state = pollStateOf(poll, expiry, settings.now);
	const timeLeft = state.closed ? "Poll closed" : expiry === undefined ? undefined : timeLeftOf(expiry, settings.now);
	return html`<div class="poll">
		<div class="poll-question">${poll.question?.text ?? ""}</div>
		<div class="poll-prompt">${poll.allow_multiselect === true ? "Select one or more answers" : "Select one answer"}</div>
		<div class="poll-answers">${(poll.answers ?? []).map((answer) => answerToHtml(answer, poll, state))}</div>
		<div class="poll-bottom"><span class="poll-details"><span>${votesText(state.total)}</span>${timeLeft === undefined ? false : html`<span>${timeLeft}</span>`}</span>${actionsToHtml(state)}</div>
	</div>`;
};
