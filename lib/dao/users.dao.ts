import { getJellyfinDb, getPlaybackDb } from "@/lib/db";
import { normalizeId } from "@/lib/helpers";
import type { UserRow } from "@/lib/types";

/**
 * User Data Access Object
 * Raw database queries for user data
 */

/**
 * Get all users from Jellyfin database
 */
export function findAllUsers(): UserRow[] {
	const db = getJellyfinDb();
	return db
		.prepare("SELECT Id, Username FROM Users ORDER BY Username")
		.all() as UserRow[];
}

/**
 * Find user by ID (handles both ID formats)
 */
export function findUserById(id: string): UserRow | undefined {
	const db = getJellyfinDb();
	const normalizedInput = normalizeId(id);

	return db
		.prepare(
			"SELECT Id, Username FROM Users WHERE LOWER(REPLACE(Id, '-', '')) = ?",
		)
		.get(normalizedInput) as UserRow | undefined;
}

/**
 * Find user by username (case-insensitive)
 */
export function findUserByUsername(username: string): UserRow | undefined {
	const db = getJellyfinDb();

	return db
		.prepare("SELECT Id, Username FROM Users WHERE LOWER(Username) = LOWER(?)")
		.get(username) as UserRow | undefined;
}

/**
 * Get distinct user IDs from playback activity
 */
export function findUsersWithPlayback(): Array<{ UserId: string }> {
	const db = getPlaybackDb();
	return db
		.prepare("SELECT DISTINCT UserId FROM PlaybackActivity")
		.all() as Array<{ UserId: string }>;
}

/**
 * Get available years for a user
 */
export function findAvailableYears(userId: string): Array<{ year: string }> {
	const db = getPlaybackDb();
	const normalizedId = normalizeId(userId);

	return db
		.prepare(
			`
			SELECT DISTINCT strftime('%Y', DateCreated) as year
			FROM PlaybackActivity
			WHERE LOWER(REPLACE(UserId, '-', '')) = ?
			ORDER BY year DESC
		`,
		)
		.all(normalizedId) as Array<{ year: string }>;
}

/**
 * Get total hours for all users in a year (for percentile calculation)
 */
export function findAllUserHoursForYear(
	year: number,
): Array<{ userId: string; totalHours: number }> {
	const db = getPlaybackDb();

	return db
		.prepare(
			`
			SELECT
				LOWER(REPLACE(UserId, '-', '')) as userId,
				SUM(PlayDuration) / 3600.0 as totalHours
			FROM PlaybackActivity
			WHERE strftime('%Y', DateCreated) = ?
				AND ItemType NOT IN ('Audio')
			GROUP BY userId
			ORDER BY totalHours DESC
		`,
		)
		.all(year.toString()) as Array<{ userId: string; totalHours: number }>;
}

/**
 * Get unique movies count for all users in a year
 */
export function findAllUsersUniqueMovies(
	year: number,
): Array<{ userId: string; uniqueMovies: number }> {
	const db = getPlaybackDb();

	return db
		.prepare(
			`
			SELECT
				LOWER(REPLACE(UserId, '-', '')) as userId,
				COUNT(DISTINCT ItemId) as uniqueMovies
			FROM PlaybackActivity
			WHERE strftime('%Y', DateCreated) = ?
				AND ItemType = 'Movie'
			GROUP BY userId
			ORDER BY uniqueMovies DESC
		`,
		)
		.all(year.toString()) as Array<{ userId: string; uniqueMovies: number }>;
}

/**
 * Get unique shows count for all users in a year (by series name extracted from episode name)
 */
export function findAllUsersUniqueShows(
	year: number,
): Array<{ userId: string; uniqueShows: number }> {
	const db = getPlaybackDb();

	// Extract series name from ItemName pattern "Show - sXXeXX - Title"
	return db
		.prepare(
			`
			SELECT
				LOWER(REPLACE(UserId, '-', '')) as userId,
				COUNT(DISTINCT
					CASE
						WHEN ItemName LIKE '% - s%e% - %'
						THEN SUBSTR(ItemName, 1, INSTR(ItemName, ' - s') - 1)
						ELSE ItemName
					END
				) as uniqueShows
			FROM PlaybackActivity
			WHERE strftime('%Y', DateCreated) = ?
				AND ItemType = 'Episode'
			GROUP BY userId
			ORDER BY uniqueShows DESC
		`,
		)
		.all(year.toString()) as Array<{ userId: string; uniqueShows: number }>;
}

/**
 * Get movie watch hours for all users in a year
 */
export function findAllUsersMovieHours(
	year: number,
): Array<{ userId: string; movieHours: number }> {
	const db = getPlaybackDb();

	return db
		.prepare(
			`
			SELECT
				LOWER(REPLACE(UserId, '-', '')) as userId,
				SUM(PlayDuration) / 3600.0 as movieHours
			FROM PlaybackActivity
			WHERE strftime('%Y', DateCreated) = ?
				AND ItemType = 'Movie'
			GROUP BY userId
			ORDER BY movieHours DESC
		`,
		)
		.all(year.toString()) as Array<{ userId: string; movieHours: number }>;
}

/**
 * Get show watch hours for all users in a year
 */
export function findAllUsersShowHours(
	year: number,
): Array<{ userId: string; showHours: number }> {
	const db = getPlaybackDb();

	return db
		.prepare(
			`
			SELECT
				LOWER(REPLACE(UserId, '-', '')) as userId,
				SUM(PlayDuration) / 3600.0 as showHours
			FROM PlaybackActivity
			WHERE strftime('%Y', DateCreated) = ?
				AND ItemType = 'Episode'
			GROUP BY userId
			ORDER BY showHours DESC
		`,
		)
		.all(year.toString()) as Array<{ userId: string; showHours: number }>;
}

/**
 * Get playback method stats for all users in a year
 */
export function findAllUsersPlaybackMethods(year: number): Array<{
	userId: string;
	direct: number;
	remux: number;
	transcode: number;
}> {
	const db = getPlaybackDb();

	return db
		.prepare(
			`
			SELECT
				LOWER(REPLACE(UserId, '-', '')) as userId,
				SUM(CASE WHEN PlaybackMethod = 'DirectPlay' THEN 1 ELSE 0 END) as direct,
				SUM(CASE WHEN PlaybackMethod = 'DirectStream' OR PlaybackMethod LIKE '%v:direct%' THEN 1 ELSE 0 END) as remux,
				SUM(CASE WHEN PlaybackMethod LIKE 'Transcode%' AND PlaybackMethod NOT LIKE '%v:direct%' THEN 1 ELSE 0 END) as transcode
			FROM PlaybackActivity
			WHERE strftime('%Y', DateCreated) = ?
				AND ItemType != 'Audio'
			GROUP BY userId
		`,
		)
		.all(year.toString()) as Array<{
		userId: string;
		direct: number;
		remux: number;
		transcode: number;
	}>;
}

/**
 * Get top movies by total watch time across all users in a year
 */
export function findServerTopMovies(
	year: number,
	limit = 5,
): Array<{
	itemId: string;
	itemName: string;
	totalSeconds: number;
	totalPlays: number;
	uniqueViewers: number;
}> {
	const db = getPlaybackDb();

	return db
		.prepare(
			`
			SELECT
				ItemId as itemId,
				ItemName as itemName,
				SUM(PlayDuration) as totalSeconds,
				COUNT(*) as totalPlays,
				COUNT(DISTINCT LOWER(REPLACE(UserId, '-', ''))) as uniqueViewers
			FROM PlaybackActivity
			WHERE strftime('%Y', DateCreated) = ?
				AND ItemType = 'Movie'
			GROUP BY ItemId
			ORDER BY totalSeconds DESC
			LIMIT ?
		`,
		)
		.all(year.toString(), limit) as Array<{
		itemId: string;
		itemName: string;
		totalSeconds: number;
		totalPlays: number;
		uniqueViewers: number;
	}>;
}

/**
 * Get top TV shows by total watch time across all users in a year
 */
export function findServerTopShows(
	year: number,
	limit = 5,
): Array<{
	seriesName: string;
	totalSeconds: number;
	totalEpisodes: number;
	uniqueViewers: number;
}> {
	const db = getPlaybackDb();

	return db
		.prepare(
			`
			SELECT
				CASE
					WHEN ItemName LIKE '% - s%e% - %'
					THEN SUBSTR(ItemName, 1, INSTR(ItemName, ' - s') - 1)
					ELSE ItemName
				END as seriesName,
				SUM(PlayDuration) as totalSeconds,
				COUNT(*) as totalEpisodes,
				COUNT(DISTINCT LOWER(REPLACE(UserId, '-', ''))) as uniqueViewers
			FROM PlaybackActivity
			WHERE strftime('%Y', DateCreated) = ?
				AND ItemType = 'Episode'
			GROUP BY seriesName
			ORDER BY totalSeconds DESC
			LIMIT ?
		`,
		)
		.all(year.toString(), limit) as Array<{
		seriesName: string;
		totalSeconds: number;
		totalEpisodes: number;
		uniqueViewers: number;
	}>;
}

/**
 * Get total server statistics for a year
 */
export function findServerTotalStats(year: number): {
	totalHours: number;
	totalPlays: number;
	uniqueUsers: number;
	uniqueMovies: number;
	uniqueEpisodes: number;
} {
	const db = getPlaybackDb();

	return db
		.prepare(
			`
			SELECT
				SUM(PlayDuration) / 3600.0 as totalHours,
				COUNT(*) as totalPlays,
				COUNT(DISTINCT LOWER(REPLACE(UserId, '-', ''))) as uniqueUsers,
				COUNT(DISTINCT CASE WHEN ItemType = 'Movie' THEN ItemId END) as uniqueMovies,
				COUNT(DISTINCT CASE WHEN ItemType = 'Episode' THEN ItemId END) as uniqueEpisodes
			FROM PlaybackActivity
			WHERE strftime('%Y', DateCreated) = ?
				AND ItemType != 'Audio'
		`,
		)
		.get(year.toString()) as {
		totalHours: number;
		totalPlays: number;
		uniqueUsers: number;
		uniqueMovies: number;
		uniqueEpisodes: number;
	};
}
