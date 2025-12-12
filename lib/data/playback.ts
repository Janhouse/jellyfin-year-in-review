/**
 * @deprecated Use imports from @/lib/services and @/lib/types instead
 * This file is kept for backwards compatibility
 */

export {
	getClientStats,
	getDayOfWeekStats,
	getDeviceStats,
	getHourlyStats,
	getMonthlyStats,
	getPlaybackMethodStats,
	getPlaybackStats,
	getTopMovies,
	getTopShows,
} from "@/lib/services";
export type {
	ClientStats,
	DayOfWeekStats,
	DeviceStats,
	HourlyStats,
	MonthlyStats,
	PlaybackMethodStats,
	PlaybackStats,
	TopItem,
} from "@/lib/types";
