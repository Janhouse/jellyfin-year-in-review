import type { TmdbItem } from "@/lib/types";

/**
 * TMDB Service
 * Handles all TMDB API interactions
 */

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

// In-memory cache for TMDB data
const cache = new Map<string, { data: TmdbItem; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

/**
 * Get poster URL for TMDB images
 */
export function getPosterUrl(
	posterPath: string | null,
	size: "w185" | "w342" | "w500" | "w780" | "original" = "w500",
): string {
	if (!posterPath) {
		return "/placeholder-poster.svg";
	}
	return `${TMDB_IMAGE_BASE}/${size}${posterPath}`;
}

/**
 * Get backdrop URL for TMDB images
 */
export function getBackdropUrl(
	backdropPath: string | null,
	size: "w300" | "w780" | "w1280" | "original" = "w1280",
): string {
	if (!backdropPath) {
		return "/placeholder-backdrop.svg";
	}
	return `${TMDB_IMAGE_BASE}/${size}${backdropPath}`;
}

/**
 * Fetch movie details from TMDB
 */
export async function getMovieDetails(
	tmdbId: string,
): Promise<TmdbItem | null> {
	const cacheKey = `movie:${tmdbId}`;
	const cached = cache.get(cacheKey);

	if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
		return cached.data;
	}

	if (!TMDB_API_KEY) {
		console.warn("TMDB_API_KEY not set");
		return null;
	}

	try {
		const response = await fetch(
			`${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US`,
		);

		if (!response.ok) {
			console.error(`TMDB API error: ${response.status}`);
			return null;
		}

		const data = (await response.json()) as TmdbItem;
		cache.set(cacheKey, { data, timestamp: Date.now() });
		return data;
	} catch (error) {
		console.error("Failed to fetch movie from TMDB:", error);
		return null;
	}
}

/**
 * Fetch TV show details from TMDB
 */
export async function getTvShowDetails(
	tmdbId: string,
): Promise<TmdbItem | null> {
	const cacheKey = `tv:${tmdbId}`;
	const cached = cache.get(cacheKey);

	if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
		return cached.data;
	}

	if (!TMDB_API_KEY) {
		console.warn("TMDB_API_KEY not set");
		return null;
	}

	try {
		const response = await fetch(
			`${TMDB_BASE_URL}/tv/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US`,
		);

		if (!response.ok) {
			console.error(`TMDB API error: ${response.status}`);
			return null;
		}

		const data = (await response.json()) as TmdbItem;
		cache.set(cacheKey, { data, timestamp: Date.now() });
		return data;
	} catch (error) {
		console.error("Failed to fetch TV show from TMDB:", error);
		return null;
	}
}

/**
 * Search for a movie or TV show by title
 */
export async function searchTmdb(
	query: string,
	type: "movie" | "tv" = "movie",
): Promise<TmdbItem | null> {
	if (!TMDB_API_KEY) {
		console.warn("TMDB_API_KEY not set");
		return null;
	}

	try {
		const response = await fetch(
			`${TMDB_BASE_URL}/search/${type}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US`,
		);

		if (!response.ok) {
			console.error(`TMDB search error: ${response.status}`);
			return null;
		}

		const data = (await response.json()) as { results: TmdbItem[] };
		return data.results[0] || null;
	} catch (error) {
		console.error("Failed to search TMDB:", error);
		return null;
	}
}

/**
 * Get movie details by name (searches TMDB then fetches full details)
 * Useful for items that have been deleted from Jellyfin but still have playback history
 */
export async function getMovieDetailsByName(
	name: string,
): Promise<TmdbItem | null> {
	const searchResult = await searchTmdb(name, "movie");
	if (!searchResult?.id) return null;

	return getMovieDetails(String(searchResult.id));
}

/**
 * Get TV show details by name (searches TMDB then fetches full details)
 * Useful for items that have been deleted from Jellyfin but still have playback history
 */
export async function getTvShowDetailsByName(
	name: string,
): Promise<TmdbItem | null> {
	const searchResult = await searchTmdb(name, "tv");
	if (!searchResult?.id) return null;

	return getTvShowDetails(String(searchResult.id));
}

/**
 * Clear the TMDB cache
 */
export function clearCache(): void {
	cache.clear();
}
