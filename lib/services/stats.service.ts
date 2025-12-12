import {
	getClientStatsRaw,
	getDeviceStatsRaw,
	getItemRuntimes,
	getItemsGenres,
	getPlaybackMethodStatsRaw,
	getSeriesAverageEpisodeRuntime,
	getSeriesGenres,
	getTmdbIdForItem,
	getTmdbIdForSeries,
} from "@/lib/dao";
import {
	DAY_NAMES,
	getDayOfWeekInTimezone,
	getHourInTimezone,
	getMonthInTimezone,
	MONTH_NAMES,
} from "@/lib/helpers";
import type {
	ClientStats,
	DayOfWeekStats,
	DeviceStats,
	HourlyStats,
	MonthlyStats,
	PlaybackMethodStats,
	PlaybackStats,
	TopItem,
} from "@/lib/types";
import {
	aggregateSessionsByItem,
	calculateTotalStats,
	getPlaybackSessions,
} from "./session.service";

/**
 * Statistics Service
 * Business logic for playback statistics using merged sessions
 */

/**
 * Get overall playback statistics for a user in a year
 * Uses merged sessions for accurate play counts
 */
export function getPlaybackStats(userId: string, year: number): PlaybackStats {
	const sessions = getPlaybackSessions(userId, year);
	const stats = calculateTotalStats(sessions);

	const totalHours = Math.round((stats.totalSeconds / 3600) * 10) / 10;
	const totalDays = Math.round((totalHours / 24) * 10) / 10;

	return {
		totalPlays: stats.totalSessions,
		totalSeconds: stats.totalSeconds,
		totalHours,
		totalDays,
		moviePlays: stats.movieSessions,
		episodePlays: stats.episodeSessions,
		audioPlays: 0, // Audio is excluded
		uniqueMovies: stats.uniqueMovies,
		uniqueEpisodes: stats.uniqueEpisodes,
	};
}

// Threshold for considering a movie "finished" (90% watched)
const FINISHED_THRESHOLD = 0.8;
// Minimum watch percentage to include in "abandoned" list (5% - filters out accidental clicks)
const ABANDONED_MIN_THRESHOLD = 0.01;

/**
 * Internal function to get movie watch data with actual watch counts
 */
function getMovieWatchData(userId: string, year: number) {
	const sessions = getPlaybackSessions(userId, year);
	const movieSessions = sessions.filter((s) => s.itemType === "Movie");
	const itemStats = aggregateSessionsByItem(movieSessions);

	if (itemStats.size === 0) return [];

	// Get runtimes for all movies
	const itemIds = Array.from(itemStats.keys());
	const runtimes = getItemRuntimes(itemIds);

	// Calculate actual watch count for each movie
	return Array.from(itemStats.values()).map((movie) => {
		const runtimeSeconds = runtimes.get(movie.itemId);
		let actualWatches = 0; // Default to 0 if no runtime
		let hasRuntimeData = false;

		if (runtimeSeconds && runtimeSeconds > 0) {
			hasRuntimeData = true;
			// Actual watches = total watch time / runtime
			actualWatches = movie.totalSeconds / runtimeSeconds;
		}

		return {
			...movie,
			actualWatches,
			hasRuntimeData,
			runtimeSeconds: runtimeSeconds || null,
		};
	});
}

/**
 * Get top movies for a user in a year
 * Uses merged sessions and calculates actual watch count based on runtime
 * Only includes movies that were actually finished (watched >= FINISHED_THRESHOLD)
 */
export function getTopMovies(
	userId: string,
	year: number,
	limit = 10,
): TopItem[] {
	const moviesWithWatchCount = getMovieWatchData(userId, year);

	if (moviesWithWatchCount.length === 0) return [];

	// Filter to only finished movies (watched at least 80%)
	// Movies without runtime data cannot be verified as finished
	const finishedMovies = moviesWithWatchCount.filter(
		(m) => m.hasRuntimeData && m.actualWatches >= FINISHED_THRESHOLD,
	);

	if (finishedMovies.length === 0) return [];

	// Sort by actual watches (descending), then by total watch time
	finishedMovies.sort((a, b) => {
		const watchDiff = b.actualWatches - a.actualWatches;
		if (Math.abs(watchDiff) > 0.1) return watchDiff;
		return b.totalSeconds - a.totalSeconds;
	});

	// Take top N and map to TopItem
	return finishedMovies.slice(0, limit).map((movie) => {
		const tmdbId = getTmdbIdForItem(movie.itemId);
		return {
			itemId: movie.itemId,
			itemName: movie.itemName,
			itemType: movie.itemType,
			plays: Math.round(movie.actualWatches * 10) / 10,
			totalMinutes: movie.totalMinutes,
			tmdbId,
		};
	});
}

/**
 * Get movies that were started but not finished (abandoned)
 * Returns movies where user watched between 1% and 80% of the runtime
 * Only includes movies with runtime data (can't determine abandonment without it)
 */
export function getAbandonedMovies(
	userId: string,
	year: number,
	limit = 10,
): TopItem[] {
	const moviesWithWatchCount = getMovieWatchData(userId, year);

	if (moviesWithWatchCount.length === 0) return [];

	// Filter to movies that were started but not finished
	// Only include movies with runtime data - can't determine abandonment without it
	// actualWatches < FINISHED_THRESHOLD means they didn't complete the movie
	// actualWatches >= ABANDONED_MIN_THRESHOLD filters out accidental clicks
	const abandonedMovies = moviesWithWatchCount.filter(
		(m) =>
			m.hasRuntimeData &&
			m.actualWatches >= ABANDONED_MIN_THRESHOLD &&
			m.actualWatches < FINISHED_THRESHOLD,
	);

	// Sort by how much was watched (most watched first - they got closest to finishing)
	abandonedMovies.sort((a, b) => b.actualWatches - a.actualWatches);

	return abandonedMovies.slice(0, limit).map((movie) => {
		const tmdbId = getTmdbIdForItem(movie.itemId);
		return {
			itemId: movie.itemId,
			itemName: movie.itemName,
			itemType: movie.itemType,
			plays: Math.round(movie.actualWatches * 100), // Return as percentage for abandoned movies
			totalMinutes: movie.totalMinutes,
			tmdbId,
		};
	});
}

/**
 * Get count of movies that were finished (watched at least 80%)
 * Only counts movies with runtime data (can't verify completion without it)
 */
export function getFinishedMovieCount(userId: string, year: number): number {
	const moviesWithWatchCount = getMovieWatchData(userId, year);
	return moviesWithWatchCount.filter(
		(m) => m.hasRuntimeData && m.actualWatches >= FINISHED_THRESHOLD,
	).length;
}

/**
 * Get top shows for a user in a year (aggregated by series)
 * Uses merged sessions and calculates actual episode watch count
 */
export function getTopShows(
	userId: string,
	year: number,
	limit = 10,
): TopItem[] {
	const sessions = getPlaybackSessions(userId, year);
	const episodeSessions = sessions.filter((s) => s.itemType === "Episode");

	if (episodeSessions.length === 0) return [];

	// Group by series name
	const showStats = new Map<
		string,
		{
			seriesName: string;
			totalSeconds: number;
			totalMinutes: number;
			sessionCount: number;
			episodes: Set<string>;
			sampleItemId: string;
		}
	>();

	for (const session of episodeSessions) {
		// Extract series name from ItemName (format: "Show - sXXeXX - Title")
		const match = session.itemName.match(/^(.+?)\s*-\s*s\d+e\d+/i);
		const seriesName = match ? match[1].trim() : session.itemName;

		const existing = showStats.get(seriesName);
		if (existing) {
			existing.totalSeconds += session.totalSeconds;
			existing.totalMinutes = Math.round(existing.totalSeconds / 60);
			existing.sessionCount += 1;
			existing.episodes.add(session.itemId);
		} else {
			showStats.set(seriesName, {
				seriesName,
				totalSeconds: session.totalSeconds,
				totalMinutes: Math.round(session.totalSeconds / 60),
				sessionCount: 1,
				episodes: new Set([session.itemId]),
				sampleItemId: session.itemId,
			});
		}
	}

	// Calculate actual episode watches for each show
	const showsWithWatchCount = Array.from(showStats.values()).map((show) => {
		let actualEpisodeWatches = show.sessionCount;

		// Get average episode runtime for this series
		const avgEpisodeRuntime = getSeriesAverageEpisodeRuntime(show.seriesName);
		if (avgEpisodeRuntime && avgEpisodeRuntime > 0) {
			actualEpisodeWatches = show.totalSeconds / avgEpisodeRuntime;
		}

		return {
			...show,
			actualEpisodeWatches,
		};
	});

	// Sort by actual episode watches
	showsWithWatchCount.sort((a, b) => {
		const watchDiff = b.actualEpisodeWatches - a.actualEpisodeWatches;
		if (Math.abs(watchDiff) > 0.5) return watchDiff;
		return b.totalSeconds - a.totalSeconds;
	});

	// Take top N
	return showsWithWatchCount.slice(0, limit).map((show) => {
		const tmdbId = getTmdbIdForSeries(show.seriesName);
		return {
			itemId: show.sampleItemId,
			itemName: show.seriesName,
			itemType: "Series",
			plays: Math.round(show.actualEpisodeWatches * 10) / 10,
			totalMinutes: show.totalMinutes,
			tmdbId,
			seriesName: show.seriesName,
		};
	});
}

/**
 * Get hourly watching patterns
 * Uses application-layer timezone conversion for accurate local time stats
 * @param timezone - Optional user timezone (defaults to TIMEZONE env var or Europe/Riga)
 */
export function getHourlyStats(
	userId: string,
	year: number,
	timezone?: string,
): HourlyStats[] {
	const sessions = getPlaybackSessions(userId, year);

	// Aggregate by hour in configured/user timezone
	const hourlyMap = new Map<number, { plays: number; seconds: number }>();

	for (const session of sessions) {
		const hour = getHourInTimezone(session.startTime, timezone);
		const existing = hourlyMap.get(hour) || { plays: 0, seconds: 0 };
		existing.plays += 1;
		existing.seconds += session.totalSeconds;
		hourlyMap.set(hour, existing);
	}

	return Array.from({ length: 24 }, (_, hour) => ({
		hour,
		plays: hourlyMap.get(hour)?.plays || 0,
		minutes: Math.round((hourlyMap.get(hour)?.seconds || 0) / 60),
	}));
}

/**
 * Get day of week watching patterns
 * Uses application-layer timezone conversion for accurate local time stats
 * @param timezone - Optional user timezone (defaults to TIMEZONE env var or Europe/Riga)
 */
export function getDayOfWeekStats(
	userId: string,
	year: number,
	timezone?: string,
): DayOfWeekStats[] {
	const sessions = getPlaybackSessions(userId, year);

	// Aggregate by day of week in configured/user timezone
	const dayMap = new Map<number, { plays: number; seconds: number }>();

	for (const session of sessions) {
		const day = getDayOfWeekInTimezone(session.startTime, timezone);
		const existing = dayMap.get(day) || { plays: 0, seconds: 0 };
		existing.plays += 1;
		existing.seconds += session.totalSeconds;
		dayMap.set(day, existing);
	}

	return Array.from({ length: 7 }, (_, day) => ({
		day,
		dayName: DAY_NAMES[day],
		plays: dayMap.get(day)?.plays || 0,
		minutes: Math.round((dayMap.get(day)?.seconds || 0) / 60),
	}));
}

/**
 * Get monthly watching patterns
 * Uses application-layer timezone conversion for accurate local time stats
 * @param timezone - Optional user timezone (defaults to TIMEZONE env var or Europe/Riga)
 */
export function getMonthlyStats(
	userId: string,
	year: number,
	timezone?: string,
): MonthlyStats[] {
	const sessions = getPlaybackSessions(userId, year);

	// Aggregate by month in configured/user timezone
	const monthMap = new Map<number, { plays: number; seconds: number }>();

	for (const session of sessions) {
		const month = getMonthInTimezone(session.startTime, timezone);
		const existing = monthMap.get(month) || { plays: 0, seconds: 0 };
		existing.plays += 1;
		existing.seconds += session.totalSeconds;
		monthMap.set(month, existing);
	}

	return Array.from({ length: 12 }, (_, i) => {
		const month = i + 1;
		return {
			month,
			monthName: MONTH_NAMES[i],
			plays: monthMap.get(month)?.plays || 0,
			hours: Math.round(((monthMap.get(month)?.seconds || 0) / 3600) * 10) / 10,
		};
	});
}

/**
 * Get device usage statistics
 */
export function getDeviceStats(userId: string, year: number): DeviceStats[] {
	const stats = getDeviceStatsRaw(userId, year);
	const total = stats.reduce((sum, s) => sum + s.plays, 0);

	return stats.map((s) => ({
		deviceName: s.deviceName || "Unknown",
		plays: s.plays,
		percentage: total > 0 ? Math.round((s.plays / total) * 1000) / 10 : 0,
	}));
}

/**
 * Get client app statistics
 */
export function getClientStats(userId: string, year: number): ClientStats[] {
	const stats = getClientStatsRaw(userId, year);
	const total = stats.reduce((sum, s) => sum + s.plays, 0);

	return stats.map((s) => ({
		clientName: s.clientName || "Unknown",
		plays: s.plays,
		percentage: total > 0 ? Math.round((s.plays / total) * 1000) / 10 : 0,
	}));
}

/**
 * Get playback method statistics (direct vs remux vs transcode)
 */
export function getPlaybackMethodStats(
	userId: string,
	year: number,
): PlaybackMethodStats {
	const stats = getPlaybackMethodStatsRaw(userId, year);
	const total =
		(stats.direct || 0) + (stats.remux || 0) + (stats.transcode || 0);

	return {
		direct: stats.direct || 0,
		remux: stats.remux || 0,
		transcode: stats.transcode || 0,
		directPercentage:
			total > 0 ? Math.round(((stats.direct || 0) / total) * 1000) / 10 : 0,
		remuxPercentage:
			total > 0 ? Math.round(((stats.remux || 0) / total) * 1000) / 10 : 0,
		transcodePercentage:
			total > 0 ? Math.round(((stats.transcode || 0) / total) * 1000) / 10 : 0,
	};
}

export interface GenreStats {
	genre: string;
	movieMinutes: number;
	showMinutes: number;
	totalMinutes: number;
	movieCount: number;
	showCount: number;
}

/**
 * Get top genres for a user based on watch time
 * Combines both movies and TV shows
 */
export function getTopGenres(
	userId: string,
	year: number,
	limit = 10,
): GenreStats[] {
	const sessions = getPlaybackSessions(userId, year);

	// Separate movies and episodes
	const movieSessions = sessions.filter((s) => s.itemType === "Movie");
	const episodeSessions = sessions.filter((s) => s.itemType === "Episode");

	// Aggregate movie stats by itemId
	const movieStats = aggregateSessionsByItem(movieSessions);

	// Aggregate show stats by series name
	const showStats = new Map<
		string,
		{ seriesName: string; totalSeconds: number }
	>();
	for (const session of episodeSessions) {
		const match = session.itemName.match(/^(.+?)\s*-\s*s\d+e\d+/i);
		const seriesName = match ? match[1].trim() : session.itemName;

		const existing = showStats.get(seriesName);
		if (existing) {
			existing.totalSeconds += session.totalSeconds;
		} else {
			showStats.set(seriesName, {
				seriesName,
				totalSeconds: session.totalSeconds,
			});
		}
	}

	// Get genres for all movies
	const movieIds = Array.from(movieStats.keys());
	const movieGenresMap = getItemsGenres(movieIds);

	// Build genre stats
	const genreStatsMap = new Map<
		string,
		{
			movieMinutes: number;
			showMinutes: number;
			movieCount: number;
			showCount: number;
		}
	>();

	// Add movie genres
	for (const [itemId, stats] of movieStats) {
		const genres = movieGenresMap.get(itemId) || [];
		const minutes = Math.round(stats.totalSeconds / 60);

		for (const genre of genres) {
			const existing = genreStatsMap.get(genre);
			if (existing) {
				existing.movieMinutes += minutes;
				existing.movieCount += 1;
			} else {
				genreStatsMap.set(genre, {
					movieMinutes: minutes,
					showMinutes: 0,
					movieCount: 1,
					showCount: 0,
				});
			}
		}
	}

	// Add show genres
	for (const [seriesName, stats] of showStats) {
		const genres = getSeriesGenres(seriesName);
		const minutes = Math.round(stats.totalSeconds / 60);

		for (const genre of genres) {
			const existing = genreStatsMap.get(genre);
			if (existing) {
				existing.showMinutes += minutes;
				existing.showCount += 1;
			} else {
				genreStatsMap.set(genre, {
					movieMinutes: 0,
					showMinutes: minutes,
					movieCount: 0,
					showCount: 1,
				});
			}
		}
	}

	// Convert to array and sort by total watch time
	const genreStats: GenreStats[] = Array.from(genreStatsMap.entries()).map(
		([genre, stats]) => ({
			genre,
			movieMinutes: stats.movieMinutes,
			showMinutes: stats.showMinutes,
			totalMinutes: stats.movieMinutes + stats.showMinutes,
			movieCount: stats.movieCount,
			showCount: stats.showCount,
		}),
	);

	genreStats.sort((a, b) => b.totalMinutes - a.totalMinutes);

	return genreStats.slice(0, limit);
}
