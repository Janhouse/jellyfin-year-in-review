/**
 * Time and date formatting helpers
 * All date/time formatting uses configured timezone (defaults to Europe/Riga)
 * User-specific timezone can be passed to override the default
 */

export const DEFAULT_TIMEZONE = process.env.TIMEZONE || "Europe/Riga";

export const MONTH_NAMES = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

export const DAY_NAMES = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
];

/**
 * Format minutes into human-readable duration
 */
export function formatDuration(minutes: number): string {
	if (minutes < 60) {
		return `${Math.round(minutes)} min`;
	}

	const hours = Math.floor(minutes / 60);
	const remainingMinutes = Math.round(minutes % 60);

	if (hours < 24) {
		if (remainingMinutes === 0) {
			return `${hours}h`;
		}
		return `${hours}h ${remainingMinutes}m`;
	}

	const days = Math.floor(hours / 24);
	const remainingHours = hours % 24;

	if (remainingHours === 0) {
		return `${days}d`;
	}
	return `${days}d ${remainingHours}h`;
}

/**
 * Format hours into human-readable duration
 */
export function formatHours(hours: number): string {
	return formatDuration(hours * 60);
}

/**
 * Format seconds into human-readable duration
 */
export function formatSeconds(seconds: number): string {
	return formatDuration(seconds / 60);
}

/**
 * Convert seconds to hours with one decimal place
 */
export function secondsToHours(seconds: number): number {
	return Math.round((seconds / 3600) * 10) / 10;
}

/**
 * Convert seconds to days with one decimal place
 */
export function secondsToDays(seconds: number): number {
	return Math.round((seconds / 86400) * 10) / 10;
}

/**
 * Get month name from 1-indexed month number
 */
export function getMonthName(month: number): string {
	return MONTH_NAMES[month - 1] || "";
}

/**
 * Get day name from 0-indexed day number (0 = Sunday)
 */
export function getDayName(day: number): string {
	return DAY_NAMES[day] || "";
}

/**
 * Format a date for display (in configured or user timezone)
 */
export function formatDate(date: Date, timezone?: string): string {
	return date.toLocaleDateString("en-US", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
		timeZone: timezone || DEFAULT_TIMEZONE,
	});
}

/**
 * Format a date for short display (in configured or user timezone)
 */
export function formatDateShort(date: Date, timezone?: string): string {
	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		timeZone: timezone || DEFAULT_TIMEZONE,
	});
}

/**
 * Format time of day (in configured or user timezone)
 */
export function formatTime(date: Date, timezone?: string): string {
	return date.toLocaleTimeString("en-US", {
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
		timeZone: timezone || DEFAULT_TIMEZONE,
	});
}

/**
 * Get hour (0-23) in the configured or user timezone from a UTC date
 * Properly handles DST transitions
 */
export function getHourInTimezone(date: Date, timezone?: string): number {
	return Number.parseInt(
		date.toLocaleString("en-US", {
			hour: "numeric",
			hour12: false,
			timeZone: timezone || DEFAULT_TIMEZONE,
		}),
		10,
	);
}

/**
 * Get day of week (0 = Sunday, 6 = Saturday) in the configured or user timezone
 * Properly handles DST transitions
 */
export function getDayOfWeekInTimezone(date: Date, timezone?: string): number {
	const dayName = date.toLocaleString("en-US", {
		weekday: "short",
		timeZone: timezone || DEFAULT_TIMEZONE,
	});
	const dayMap: Record<string, number> = {
		Sun: 0,
		Mon: 1,
		Tue: 2,
		Wed: 3,
		Thu: 4,
		Fri: 5,
		Sat: 6,
	};
	return dayMap[dayName] ?? 0;
}

/**
 * Get month (1-12) in the configured or user timezone from a UTC date
 * Properly handles month boundaries with timezone offset
 */
export function getMonthInTimezone(date: Date, timezone?: string): number {
	return Number.parseInt(
		date.toLocaleString("en-US", {
			month: "numeric",
			timeZone: timezone || DEFAULT_TIMEZONE,
		}),
		10,
	);
}
