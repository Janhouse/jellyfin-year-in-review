import {
	findServerTopMovies,
	findServerTopShows,
	findServerTotalStats,
	getTmdbIdForItem,
} from "@/lib/dao";
import { searchTmdb } from "./tmdb.service";

/**
 * Server Stats Service
 * Server-wide statistics for all users combined
 */

export interface ServerTopMovie {
	itemId: string;
	itemName: string;
	totalHours: number;
	totalPlays: number;
	uniqueViewers: number;
	tmdbId: string | null;
}

export interface ServerTopShow {
	seriesName: string;
	totalHours: number;
	totalEpisodes: number;
	uniqueViewers: number;
	tmdbId: string | null;
}

export interface ServerStats {
	totalHours: number;
	totalPlays: number;
	uniqueUsers: number;
	uniqueMovies: number;
	uniqueEpisodes: number;
}

/**
 * Get top movies watched across all users
 */
export async function getServerTopMovies(
	year: number,
	limit = 5,
): Promise<ServerTopMovie[]> {
	const movies = findServerTopMovies(year, limit);

	return Promise.all(
		movies.map(async (movie) => {
			// Try to get TMDB ID from local DB first
			let tmdbId = getTmdbIdForItem(movie.itemId);

			// If not found, search TMDB
			if (!tmdbId) {
				const searchResult = await searchTmdb(movie.itemName, "movie");
				if (searchResult?.id) {
					tmdbId = String(searchResult.id);
				}
			}

			return {
				itemId: movie.itemId,
				itemName: movie.itemName,
				totalHours: Math.round((movie.totalSeconds / 3600) * 10) / 10,
				totalPlays: movie.totalPlays,
				uniqueViewers: movie.uniqueViewers,
				tmdbId,
			};
		}),
	);
}

/**
 * Get top shows watched across all users
 */
export async function getServerTopShows(
	year: number,
	limit = 5,
): Promise<ServerTopShow[]> {
	const shows = findServerTopShows(year, limit);

	return Promise.all(
		shows.map(async (show) => {
			// Search TMDB for the show
			const searchResult = await searchTmdb(show.seriesName, "tv");
			const tmdbId = searchResult?.id ? String(searchResult.id) : null;

			return {
				seriesName: show.seriesName,
				totalHours: Math.round((show.totalSeconds / 3600) * 10) / 10,
				totalEpisodes: show.totalEpisodes,
				uniqueViewers: show.uniqueViewers,
				tmdbId,
			};
		}),
	);
}

/**
 * Get total server statistics
 */
export function getServerStats(year: number): ServerStats {
	const stats = findServerTotalStats(year);

	return {
		totalHours: Math.round((stats.totalHours || 0) * 10) / 10,
		totalPlays: stats.totalPlays || 0,
		uniqueUsers: stats.uniqueUsers || 0,
		uniqueMovies: stats.uniqueMovies || 0,
		uniqueEpisodes: stats.uniqueEpisodes || 0,
	};
}

/**
 * Get available years for server stats
 */
export function getServerAvailableYears(): number[] {
	// Use playback DB to get all years with data
	const { getPlaybackDb } = require("@/lib/db");
	const db = getPlaybackDb();

	const years = db
		.prepare(
			`
			SELECT DISTINCT strftime('%Y', DateCreated) as year
			FROM PlaybackActivity
			WHERE ItemType != 'Audio'
			ORDER BY year DESC
		`,
		)
		.all() as Array<{ year: string }>;

	return years.map((y) => Number.parseInt(y.year, 10));
}
