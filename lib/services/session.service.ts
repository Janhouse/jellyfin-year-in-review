import { getPlaybackActivityOrdered } from "@/lib/dao";
import { normalizeId } from "@/lib/helpers";
import type { PlaybackActivityRow } from "@/lib/types";

/**
 * Session Service
 * Merges raw Jellyfin playback events into meaningful viewing sessions
 *
 * Jellyfin logs multiple events per viewing:
 * - A "start" event (often 0 duration)
 * - Progress updates
 * - A "completion" event with actual duration
 *
 * This service merges consecutive same-item events into single sessions.
 */

// Maximum gap between events to consider them part of the same session (in seconds)
const MAX_SESSION_GAP_SECONDS = 300; // 5 minutes

export interface PlaybackSession {
	itemId: string;
	itemName: string;
	itemType: string;
	startTime: Date;
	endTime: Date;
	totalSeconds: number;
	eventCount: number;
}

export interface ItemAggregatedStats {
	itemId: string;
	itemName: string;
	itemType: string;
	sessionCount: number;
	totalSeconds: number;
	totalMinutes: number;
	sessions: PlaybackSession[];
}

/**
 * Parse a playback row into a session-compatible format
 */
function parseEvent(row: PlaybackActivityRow): {
	itemId: string;
	itemName: string;
	itemType: string;
	startTime: Date;
	duration: number;
} {
	return {
		itemId: normalizeId(row.ItemId),
		itemName: row.ItemName,
		itemType: row.ItemType,
		startTime: new Date(row.DateCreated),
		duration: row.PlayDuration || 0,
	};
}

/**
 * Check if two events should be merged into the same session
 * - Same item
 * - Second event starts within MAX_SESSION_GAP_SECONDS of first event ending
 */
function shouldMergeEvents(
	first: { startTime: Date; duration: number },
	second: { startTime: Date },
): boolean {
	const firstEndTime = first.startTime.getTime() + first.duration * 1000;
	const secondStartTime = second.startTime.getTime();
	const gapSeconds = (secondStartTime - firstEndTime) / 1000;

	// Merge if gap is small (including negative gaps for overlapping events)
	return gapSeconds <= MAX_SESSION_GAP_SECONDS && gapSeconds >= -60;
}

/**
 * Merge consecutive playback events into sessions
 * Groups by item and merges events that are close together in time
 */
export function mergeEventsIntoSessions(
	events: PlaybackActivityRow[],
): PlaybackSession[] {
	if (events.length === 0) return [];

	const sessions: PlaybackSession[] = [];
	let currentSession: {
		itemId: string;
		itemName: string;
		itemType: string;
		startTime: Date;
		events: Array<{ startTime: Date; duration: number }>;
	} | null = null;

	for (const row of events) {
		const event = parseEvent(row);

		if (
			currentSession &&
			currentSession.itemId === event.itemId &&
			shouldMergeEvents(
				currentSession.events[currentSession.events.length - 1],
				event,
			)
		) {
			// Merge into current session
			currentSession.events.push({
				startTime: event.startTime,
				duration: event.duration,
			});
		} else {
			// Finalize previous session if exists
			if (currentSession && currentSession.events.length > 0) {
				const totalSeconds = currentSession.events.reduce(
					(sum, e) => sum + e.duration,
					0,
				);
				const lastEvent =
					currentSession.events[currentSession.events.length - 1];
				const endTime = new Date(
					lastEvent.startTime.getTime() + lastEvent.duration * 1000,
				);

				sessions.push({
					itemId: currentSession.itemId,
					itemName: currentSession.itemName,
					itemType: currentSession.itemType,
					startTime: currentSession.startTime,
					endTime,
					totalSeconds,
					eventCount: currentSession.events.length,
				});
			}

			// Start new session
			currentSession = {
				itemId: event.itemId,
				itemName: event.itemName,
				itemType: event.itemType,
				startTime: event.startTime,
				events: [{ startTime: event.startTime, duration: event.duration }],
			};
		}
	}

	// Don't forget the last session
	if (currentSession && currentSession.events.length > 0) {
		const totalSeconds = currentSession.events.reduce(
			(sum, e) => sum + e.duration,
			0,
		);
		const lastEvent = currentSession.events[currentSession.events.length - 1];
		const endTime = new Date(
			lastEvent.startTime.getTime() + lastEvent.duration * 1000,
		);

		sessions.push({
			itemId: currentSession.itemId,
			itemName: currentSession.itemName,
			itemType: currentSession.itemType,
			startTime: currentSession.startTime,
			endTime,
			totalSeconds,
			eventCount: currentSession.events.length,
		});
	}

	return sessions;
}

/**
 * Get all playback sessions for a user in a year
 */
export function getPlaybackSessions(
	userId: string,
	year: number,
): PlaybackSession[] {
	const events = getPlaybackActivityOrdered(userId, year);
	return mergeEventsIntoSessions(events);
}

/**
 * Aggregate sessions by item - for top movies/shows calculation
 */
export function aggregateSessionsByItem(
	sessions: PlaybackSession[],
): Map<string, ItemAggregatedStats> {
	const itemStats = new Map<string, ItemAggregatedStats>();

	for (const session of sessions) {
		const existing = itemStats.get(session.itemId);

		if (existing) {
			existing.sessionCount += 1;
			existing.totalSeconds += session.totalSeconds;
			existing.totalMinutes = Math.round(existing.totalSeconds / 60);
			existing.sessions.push(session);
		} else {
			itemStats.set(session.itemId, {
				itemId: session.itemId,
				itemName: session.itemName,
				itemType: session.itemType,
				sessionCount: 1,
				totalSeconds: session.totalSeconds,
				totalMinutes: Math.round(session.totalSeconds / 60),
				sessions: [session],
			});
		}
	}

	return itemStats;
}

/**
 * Get aggregated stats for all items a user watched in a year
 */
export function getItemStats(
	userId: string,
	year: number,
): Map<string, ItemAggregatedStats> {
	const sessions = getPlaybackSessions(userId, year);
	return aggregateSessionsByItem(sessions);
}

/**
 * Get aggregated stats filtered by item type
 */
export function getItemStatsByType(
	userId: string,
	year: number,
	itemType: "Movie" | "Episode",
): ItemAggregatedStats[] {
	const allStats = getItemStats(userId, year);
	return Array.from(allStats.values()).filter(
		(stat) => stat.itemType === itemType,
	);
}

/**
 * Calculate total playback statistics from sessions
 */
export function calculateTotalStats(sessions: PlaybackSession[]): {
	totalSessions: number;
	totalSeconds: number;
	movieSessions: number;
	movieSeconds: number;
	episodeSessions: number;
	episodeSeconds: number;
	uniqueMovies: number;
	uniqueEpisodes: number;
} {
	let totalSessions = 0;
	let totalSeconds = 0;
	let movieSessions = 0;
	let movieSeconds = 0;
	let episodeSessions = 0;
	let episodeSeconds = 0;
	const uniqueMovieIds = new Set<string>();
	const uniqueEpisodeIds = new Set<string>();

	for (const session of sessions) {
		totalSessions += 1;
		totalSeconds += session.totalSeconds;

		if (session.itemType === "Movie") {
			movieSessions += 1;
			movieSeconds += session.totalSeconds;
			uniqueMovieIds.add(session.itemId);
		} else if (session.itemType === "Episode") {
			episodeSessions += 1;
			episodeSeconds += session.totalSeconds;
			uniqueEpisodeIds.add(session.itemId);
		}
	}

	return {
		totalSessions,
		totalSeconds,
		movieSessions,
		movieSeconds,
		episodeSessions,
		episodeSeconds,
		uniqueMovies: uniqueMovieIds.size,
		uniqueEpisodes: uniqueEpisodeIds.size,
	};
}
