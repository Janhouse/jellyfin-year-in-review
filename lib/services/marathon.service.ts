import { formatDate } from "@/lib/helpers";
import type { Marathon, MarathonItem } from "@/lib/types";
import { getPlaybackSessions, type PlaybackSession } from "./session.service";

/**
 * Marathon Service
 * Detects continuous watching sessions ("marathons") using merged playback sessions
 */

// Maximum gap between sessions to be considered part of the same marathon (in minutes)
const MAX_MARATHON_GAP_MINUTES = 45;

/**
 * Check if two sessions are part of the same marathon
 * (second starts within MAX_MARATHON_GAP_MINUTES of first ending)
 */
function isPartOfSameMarathon(
	first: PlaybackSession,
	second: PlaybackSession,
): boolean {
	const gapMs = second.startTime.getTime() - first.endTime.getTime();
	const gapMinutes = gapMs / (1000 * 60);

	// Allow some tolerance for overlapping or closely spaced sessions
	return gapMinutes >= -5 && gapMinutes <= MAX_MARATHON_GAP_MINUTES;
}

/**
 * Group sessions into marathon groups
 */
function groupIntoMarathons(sessions: PlaybackSession[]): PlaybackSession[][] {
	if (sessions.length === 0) return [];

	const marathons: PlaybackSession[][] = [];
	let currentMarathon: PlaybackSession[] = [sessions[0]];

	for (let i = 1; i < sessions.length; i++) {
		const prev = currentMarathon[currentMarathon.length - 1];
		const curr = sessions[i];

		if (isPartOfSameMarathon(prev, curr)) {
			currentMarathon.push(curr);
		} else {
			marathons.push(currentMarathon);
			currentMarathon = [curr];
		}
	}

	// Don't forget the last marathon
	marathons.push(currentMarathon);

	return marathons;
}

/**
 * Convert grouped sessions into a Marathon object
 */
function createMarathon(
	sessions: PlaybackSession[],
	timezone?: string,
): Marathon {
	const startTime = sessions[0].startTime;
	const endTime = sessions[sessions.length - 1].endTime;

	// Total duration from first start to last end
	const totalMs = endTime.getTime() - startTime.getTime();
	const totalMinutes = totalMs / (1000 * 60);
	const totalHours = totalMinutes / 60;

	const items: MarathonItem[] = sessions.map((s) => ({
		itemId: s.itemId,
		itemName: s.itemName,
		itemType: s.itemType,
		startTime: s.startTime,
		endTime: s.endTime,
		durationMinutes: Math.round(s.totalSeconds / 60),
	}));

	return {
		startTime,
		endTime,
		totalMinutes: Math.round(totalMinutes),
		totalHours: Math.round(totalHours * 10) / 10,
		items,
		itemCount: items.length,
		date: formatDate(startTime, timezone),
	};
}

/**
 * Get the longest watch marathon for a user in a year
 * @param timezone - Optional user timezone for date formatting
 */
export function getLongestMarathon(
	userId: string,
	year: number,
	timezone?: string,
): Marathon | null {
	const sessions = getPlaybackSessions(userId, year);

	if (sessions.length === 0) return null;

	// Sessions are already sorted by time from getPlaybackSessions
	const marathonGroups = groupIntoMarathons(sessions);

	// Filter to marathons with at least 2 items
	const validMarathons = marathonGroups.filter((group) => group.length >= 2);

	if (validMarathons.length === 0) return null;

	// Convert to Marathon objects and find the longest
	const marathons = validMarathons.map((g) => createMarathon(g, timezone));

	return marathons.reduce((longest, current) =>
		current.totalMinutes > longest.totalMinutes ? current : longest,
	);
}

/**
 * Get top N longest marathons for a user in a year
 * @param timezone - Optional user timezone for date formatting
 */
export function getTopMarathons(
	userId: string,
	year: number,
	limit = 5,
	timezone?: string,
): Marathon[] {
	const sessions = getPlaybackSessions(userId, year);

	if (sessions.length === 0) return [];

	const marathonGroups = groupIntoMarathons(sessions);

	// Filter to marathons with at least 2 items
	const validMarathons = marathonGroups.filter((group) => group.length >= 2);

	// Convert to Marathon objects
	const marathons = validMarathons.map((g) => createMarathon(g, timezone));

	// Sort by duration descending and return top N
	return marathons
		.sort((a, b) => b.totalMinutes - a.totalMinutes)
		.slice(0, limit);
}

/**
 * Get marathon statistics summary
 * @param timezone - Optional user timezone for date formatting
 */
export function getMarathonStats(
	userId: string,
	year: number,
	timezone?: string,
): {
	totalMarathons: number;
	totalMarathonHours: number;
	averageMarathonLength: number;
	longestMarathon: Marathon | null;
} {
	const sessions = getPlaybackSessions(userId, year);

	if (sessions.length === 0) {
		return {
			totalMarathons: 0,
			totalMarathonHours: 0,
			averageMarathonLength: 0,
			longestMarathon: null,
		};
	}

	const marathonGroups = groupIntoMarathons(sessions);

	// Filter to marathons with at least 2 items
	const validMarathons = marathonGroups.filter((group) => group.length >= 2);
	const marathons = validMarathons.map((g) => createMarathon(g, timezone));

	if (marathons.length === 0) {
		return {
			totalMarathons: 0,
			totalMarathonHours: 0,
			averageMarathonLength: 0,
			longestMarathon: null,
		};
	}

	const totalMinutes = marathons.reduce((sum, m) => sum + m.totalMinutes, 0);
	const longestMarathon = marathons.reduce((longest, current) =>
		current.totalMinutes > longest.totalMinutes ? current : longest,
	);

	return {
		totalMarathons: marathons.length,
		totalMarathonHours: Math.round((totalMinutes / 60) * 10) / 10,
		averageMarathonLength: Math.round(totalMinutes / marathons.length),
		longestMarathon,
	};
}
