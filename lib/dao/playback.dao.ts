import { getPlaybackDb } from "@/lib/db";
import { normalizeId } from "@/lib/helpers";
import type { PlaybackActivityRow } from "@/lib/types";

/**
 * Playback Data Access Object
 * Raw database queries for playback data
 */

interface PlaybackStatsRow {
	totalPlays: number;
	totalSeconds: number;
	moviePlays: number;
	episodePlays: number;
	audioPlays: number;
}

interface ItemStatsRow {
	ItemId: string;
	ItemName: string;
	ItemType: string;
	plays: number;
	totalSeconds: number;
	totalMinutes: number;
}

interface HourlyRow {
	hour: number;
	plays: number;
	minutes: number;
}

interface DayRow {
	day: number;
	plays: number;
	minutes: number;
}

interface MonthRow {
	month: number;
	plays: number;
	hours: number;
}

interface DeviceRow {
	deviceName: string;
	plays: number;
}

interface ClientRow {
	clientName: string;
	plays: number;
}

interface PlaybackMethodRow {
	direct: number;
	remux: number;
	transcode: number;
}

/**
 * Get aggregate playback statistics for a user in a year
 * Total plays/seconds EXCLUDES audio, but audioPlays is still counted separately
 */
export function getPlaybackStatsRaw(
	userId: string,
	year: number,
): PlaybackStatsRow {
	const db = getPlaybackDb();
	const normalizedId = normalizeId(userId);

	return db
		.prepare(
			`
			SELECT
				SUM(CASE WHEN ItemType != 'Audio' THEN 1 ELSE 0 END) as totalPlays,
				COALESCE(SUM(CASE WHEN ItemType != 'Audio' THEN PlayDuration ELSE 0 END), 0) as totalSeconds,
				SUM(CASE WHEN ItemType = 'Movie' THEN 1 ELSE 0 END) as moviePlays,
				SUM(CASE WHEN ItemType = 'Episode' THEN 1 ELSE 0 END) as episodePlays,
				SUM(CASE WHEN ItemType = 'Audio' THEN 1 ELSE 0 END) as audioPlays
			FROM PlaybackActivity
			WHERE LOWER(REPLACE(UserId, '-', '')) = ?
				AND strftime('%Y', DateCreated) = ?
		`,
		)
		.get(normalizedId, year.toString()) as PlaybackStatsRow;
}

/**
 * Get all movie playback data for a user in a year
 * Returns raw data for calculating actual watch counts based on runtime
 */
export function getMoviePlaysRaw(userId: string, year: number): ItemStatsRow[] {
	const db = getPlaybackDb();
	const normalizedId = normalizeId(userId);

	return db
		.prepare(
			`
			SELECT
				ItemId,
				ItemName,
				ItemType,
				COUNT(*) as plays,
				SUM(PlayDuration) as totalSeconds,
				SUM(PlayDuration) / 60 as totalMinutes
			FROM PlaybackActivity
			WHERE LOWER(REPLACE(UserId, '-', '')) = ?
				AND strftime('%Y', DateCreated) = ?
				AND ItemType = 'Movie'
			GROUP BY ItemId
		`,
		)
		.all(normalizedId, year.toString()) as ItemStatsRow[];
}

/**
 * Get all episode plays (for aggregation by show)
 * Returns raw data for calculating actual watch counts based on runtime
 */
export function getEpisodePlaysRaw(
	userId: string,
	year: number,
): ItemStatsRow[] {
	const db = getPlaybackDb();
	const normalizedId = normalizeId(userId);

	return db
		.prepare(
			`
			SELECT
				ItemName,
				ItemId,
				ItemType,
				COUNT(*) as plays,
				SUM(PlayDuration) as totalSeconds,
				SUM(PlayDuration) / 60 as totalMinutes
			FROM PlaybackActivity
			WHERE LOWER(REPLACE(UserId, '-', '')) = ?
				AND strftime('%Y', DateCreated) = ?
				AND ItemType = 'Episode'
			GROUP BY ItemId
		`,
		)
		.all(normalizedId, year.toString()) as ItemStatsRow[];
}

/**
 * Get hourly statistics (excludes audio)
 * Note: Returns UTC hours. For timezone-aware stats, use getHourlyStats from stats.service.ts
 */
export function getHourlyStatsRaw(userId: string, year: number): HourlyRow[] {
	const db = getPlaybackDb();
	const normalizedId = normalizeId(userId);

	return db
		.prepare(
			`
			SELECT
				CAST(strftime('%H', DateCreated) AS INTEGER) as hour,
				COUNT(*) as plays,
				SUM(PlayDuration) / 60 as minutes
			FROM PlaybackActivity
			WHERE LOWER(REPLACE(UserId, '-', '')) = ?
				AND strftime('%Y', DateCreated) = ?
				AND ItemType != 'Audio'
			GROUP BY hour
			ORDER BY hour
		`,
		)
		.all(normalizedId, year.toString()) as HourlyRow[];
}

/**
 * Get day of week statistics (excludes audio)
 * Note: Returns UTC days. For timezone-aware stats, use getDayOfWeekStats from stats.service.ts
 */
export function getDayOfWeekStatsRaw(userId: string, year: number): DayRow[] {
	const db = getPlaybackDb();
	const normalizedId = normalizeId(userId);

	return db
		.prepare(
			`
			SELECT
				CAST(strftime('%w', DateCreated) AS INTEGER) as day,
				COUNT(*) as plays,
				SUM(PlayDuration) / 60 as minutes
			FROM PlaybackActivity
			WHERE LOWER(REPLACE(UserId, '-', '')) = ?
				AND strftime('%Y', DateCreated) = ?
				AND ItemType != 'Audio'
			GROUP BY day
			ORDER BY day
		`,
		)
		.all(normalizedId, year.toString()) as DayRow[];
}

/**
 * Get monthly statistics (excludes audio)
 * Note: Returns UTC months. For timezone-aware stats, use getMonthlyStats from stats.service.ts
 */
export function getMonthlyStatsRaw(userId: string, year: number): MonthRow[] {
	const db = getPlaybackDb();
	const normalizedId = normalizeId(userId);

	return db
		.prepare(
			`
			SELECT
				CAST(strftime('%m', DateCreated) AS INTEGER) as month,
				COUNT(*) as plays,
				SUM(PlayDuration) / 3600.0 as hours
			FROM PlaybackActivity
			WHERE LOWER(REPLACE(UserId, '-', '')) = ?
				AND strftime('%Y', DateCreated) = ?
				AND ItemType != 'Audio'
			GROUP BY month
			ORDER BY month
		`,
		)
		.all(normalizedId, year.toString()) as MonthRow[];
}

/**
 * Get device usage statistics (excludes audio)
 */
export function getDeviceStatsRaw(userId: string, year: number): DeviceRow[] {
	const db = getPlaybackDb();
	const normalizedId = normalizeId(userId);

	return db
		.prepare(
			`
			SELECT
				DeviceName as deviceName,
				COUNT(*) as plays
			FROM PlaybackActivity
			WHERE LOWER(REPLACE(UserId, '-', '')) = ?
				AND strftime('%Y', DateCreated) = ?
				AND ItemType != 'Audio'
			GROUP BY DeviceName
			ORDER BY plays DESC
		`,
		)
		.all(normalizedId, year.toString()) as DeviceRow[];
}

/**
 * Get client app statistics (excludes audio)
 */
export function getClientStatsRaw(userId: string, year: number): ClientRow[] {
	const db = getPlaybackDb();
	const normalizedId = normalizeId(userId);

	return db
		.prepare(
			`
			SELECT
				ClientName as clientName,
				COUNT(*) as plays
			FROM PlaybackActivity
			WHERE LOWER(REPLACE(UserId, '-', '')) = ?
				AND strftime('%Y', DateCreated) = ?
				AND ItemType != 'Audio'
			GROUP BY ClientName
			ORDER BY plays DESC
		`,
		)
		.all(normalizedId, year.toString()) as ClientRow[];
}

/**
 * Get playback method statistics (direct vs remux vs transcode, excludes audio)
 * DirectPlay = fully direct
 * DirectStream or Transcode with v:direct = remux (video direct, audio may be transcoded)
 * Transcode (without v:direct) = full transcode
 */
export function getPlaybackMethodStatsRaw(
	userId: string,
	year: number,
): PlaybackMethodRow {
	const db = getPlaybackDb();
	const normalizedId = normalizeId(userId);

	return db
		.prepare(
			`
			SELECT
				SUM(CASE WHEN PlaybackMethod = 'DirectPlay' THEN 1 ELSE 0 END) as direct,
				SUM(CASE WHEN PlaybackMethod = 'DirectStream' OR PlaybackMethod LIKE '%v:direct%' THEN 1 ELSE 0 END) as remux,
				SUM(CASE WHEN PlaybackMethod LIKE 'Transcode%' AND PlaybackMethod NOT LIKE '%v:direct%' THEN 1 ELSE 0 END) as transcode
			FROM PlaybackActivity
			WHERE LOWER(REPLACE(UserId, '-', '')) = ?
				AND strftime('%Y', DateCreated) = ?
				AND ItemType != 'Audio'
		`,
		)
		.get(normalizedId, year.toString()) as PlaybackMethodRow;
}

/**
 * Get all playback activity for a user in a year, ordered by time
 * Used for marathon detection (excludes audio)
 */
export function getPlaybackActivityOrdered(
	userId: string,
	year: number,
): PlaybackActivityRow[] {
	const db = getPlaybackDb();
	const normalizedId = normalizeId(userId);

	return db
		.prepare(
			`
			SELECT
				rowid,
				DateCreated,
				UserId,
				ItemId,
				ItemType,
				ItemName,
				PlaybackMethod,
				ClientName,
				DeviceName,
				PlayDuration
			FROM PlaybackActivity
			WHERE LOWER(REPLACE(UserId, '-', '')) = ?
				AND strftime('%Y', DateCreated) = ?
				AND ItemType != 'Audio'
			ORDER BY DateCreated ASC
		`,
		)
		.all(normalizedId, year.toString()) as PlaybackActivityRow[];
}
