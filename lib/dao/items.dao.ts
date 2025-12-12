import { getJellyfinDb } from "@/lib/db";
import { normalizeId, toUuidFormat } from "@/lib/helpers";
import type { BaseItemRow } from "@/lib/types";

// Ticks to seconds conversion (Jellyfin stores runtime in 100-nanosecond ticks)
const TICKS_PER_SECOND = 10000000;

/**
 * Items Data Access Object
 * Raw database queries for item metadata
 */

/**
 * Get TMDB ID for an item
 */
export function getTmdbIdForItem(itemId: string): string | null {
	const db = getJellyfinDb();
	const uuidId = toUuidFormat(itemId);

	const provider = db
		.prepare(
			`
			SELECT ProviderValue
			FROM BaseItemProviders
			WHERE ItemId = ? AND ProviderId = 'Tmdb'
		`,
		)
		.get(uuidId) as { ProviderValue: string } | undefined;

	return provider?.ProviderValue || null;
}

/**
 * Get series by name
 */
export function findSeriesByName(seriesName: string): BaseItemRow | undefined {
	const db = getJellyfinDb();

	return db
		.prepare(
			`
			SELECT Id, Name, Type
			FROM BaseItems
			WHERE Type = 'MediaBrowser.Controller.Entities.TV.Series'
				AND Name = ?
			LIMIT 1
		`,
		)
		.get(seriesName) as BaseItemRow | undefined;
}

/**
 * Get TMDB ID for a series by name
 */
export function getTmdbIdForSeries(seriesName: string): string | null {
	const db = getJellyfinDb();

	const series = findSeriesByName(seriesName);
	if (!series) return null;

	const provider = db
		.prepare(
			`
			SELECT ProviderValue
			FROM BaseItemProviders
			WHERE ItemId = ? AND ProviderId = 'Tmdb'
		`,
		)
		.get(series.Id) as { ProviderValue: string } | undefined;

	return provider?.ProviderValue || null;
}

/**
 * Get item details by ID
 */
export function findItemById(itemId: string): BaseItemRow | undefined {
	const db = getJellyfinDb();
	const uuidId = toUuidFormat(itemId);

	return db
		.prepare(
			`
			SELECT Id, Name, Type, SeriesName
			FROM BaseItems
			WHERE Id = ?
		`,
		)
		.get(uuidId) as BaseItemRow | undefined;
}

/**
 * Get runtime in seconds for an item by ID
 */
export function getItemRuntimeSeconds(itemId: string): number | null {
	const db = getJellyfinDb();
	const uuidId = toUuidFormat(itemId);

	const result = db
		.prepare(
			`
			SELECT RunTimeTicks / ? as runtimeSeconds
			FROM BaseItems
			WHERE Id = ?
				AND RunTimeTicks > 0
		`,
		)
		.get(TICKS_PER_SECOND, uuidId) as { runtimeSeconds: number } | undefined;

	return result?.runtimeSeconds || null;
}

/**
 * Get runtime for multiple items by their IDs
 * Returns a map of itemId (normalized) -> runtime in seconds
 */
export function getItemRuntimes(itemIds: string[]): Map<string, number> {
	const db = getJellyfinDb();
	const runtimes = new Map<string, number>();

	if (itemIds.length === 0) return runtimes;

	// Convert to UUID format for query
	const uuidIds = itemIds.map(toUuidFormat);
	const placeholders = uuidIds.map(() => "?").join(",");

	const results = db
		.prepare(
			`
			SELECT Id, RunTimeTicks / ? as runtimeSeconds
			FROM BaseItems
			WHERE Id IN (${placeholders})
				AND RunTimeTicks > 0
		`,
		)
		.all(TICKS_PER_SECOND, ...uuidIds) as Array<{
		Id: string;
		runtimeSeconds: number;
	}>;

	for (const row of results) {
		runtimes.set(normalizeId(row.Id), row.runtimeSeconds);
	}

	return runtimes;
}

/**
 * Get series runtime (average episode runtime) by series name
 */
export function getSeriesAverageEpisodeRuntime(
	seriesName: string,
): number | null {
	const db = getJellyfinDb();

	const result = db
		.prepare(
			`
			SELECT AVG(RunTimeTicks) / ? as avgRuntimeSeconds
			FROM BaseItems
			WHERE Type = 'MediaBrowser.Controller.Entities.TV.Episode'
				AND SeriesName = ?
				AND RunTimeTicks > 0
		`,
		)
		.get(TICKS_PER_SECOND, seriesName) as
		| { avgRuntimeSeconds: number }
		| undefined;

	return result?.avgRuntimeSeconds || null;
}

/**
 * Get genres for an item by ID
 * Returns pipe-delimited genres string or null
 */
export function getItemGenres(itemId: string): string | null {
	const db = getJellyfinDb();
	const uuidId = toUuidFormat(itemId);

	const result = db
		.prepare(
			`
			SELECT Genres
			FROM BaseItems
			WHERE Id = ?
		`,
		)
		.get(uuidId) as { Genres: string | null } | undefined;

	return result?.Genres || null;
}

/**
 * Get genres for multiple items by their IDs
 * Returns a map of itemId (normalized) -> array of genres
 */
export function getItemsGenres(itemIds: string[]): Map<string, string[]> {
	const db = getJellyfinDb();
	const genresMap = new Map<string, string[]>();

	if (itemIds.length === 0) return genresMap;

	// Convert to UUID format for query
	const uuidIds = itemIds.map(toUuidFormat);
	const placeholders = uuidIds.map(() => "?").join(",");

	const results = db
		.prepare(
			`
			SELECT Id, Genres
			FROM BaseItems
			WHERE Id IN (${placeholders})
				AND Genres IS NOT NULL
				AND length(Genres) > 0
		`,
		)
		.all(...uuidIds) as Array<{
		Id: string;
		Genres: string;
	}>;

	for (const row of results) {
		const genres = row.Genres.split("|").filter((g) => g.length > 0);
		genresMap.set(normalizeId(row.Id), genres);
	}

	return genresMap;
}

/**
 * Get genres for a movie by its ID
 */
export function getMovieGenres(itemId: string): string[] {
	const genres = getItemGenres(itemId);
	return genres ? genres.split("|").filter((g) => g.length > 0) : [];
}

/**
 * Get genres for a series by name
 */
export function getSeriesGenres(seriesName: string): string[] {
	const db = getJellyfinDb();

	const result = db
		.prepare(
			`
			SELECT Genres
			FROM BaseItems
			WHERE Type = 'MediaBrowser.Controller.Entities.TV.Series'
				AND Name = ?
			LIMIT 1
		`,
		)
		.get(seriesName) as { Genres: string | null } | undefined;

	if (!result?.Genres) return [];
	return result.Genres.split("|").filter((g) => g.length > 0);
}
