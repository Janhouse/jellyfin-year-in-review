// User types
export interface User {
	id: string;
	username: string;
	normalizedId: string;
}

// Playback statistics types
export interface PlaybackStats {
	totalPlays: number;
	totalSeconds: number;
	totalHours: number;
	totalDays: number;
	moviePlays: number;
	episodePlays: number;
	audioPlays: number;
	uniqueMovies: number;
	uniqueEpisodes: number;
}

export interface TopItem {
	itemId: string;
	itemName: string;
	itemType: string;
	plays: number;
	totalMinutes: number;
	tmdbId: string | null;
	seriesName?: string;
}

export interface TopItemWithPoster extends TopItem {
	posterUrl: string;
	backdropUrl: string | null;
	rating: number | null;
	existsInJellyfin: boolean;
	itemUrl: string | null;
}

export interface HourlyStats {
	hour: number;
	plays: number;
	minutes: number;
}

export interface DayOfWeekStats {
	day: number; // 0 = Sunday, 6 = Saturday
	dayName: string;
	plays: number;
	minutes: number;
}

export interface MonthlyStats {
	month: number;
	monthName: string;
	plays: number;
	hours: number;
}

export interface DeviceStats {
	deviceName: string;
	plays: number;
	percentage: number;
}

export interface ClientStats {
	clientName: string;
	plays: number;
	percentage: number;
}

export interface PlaybackMethodStats {
	direct: number;
	remux: number;
	transcode: number;
	directPercentage: number;
	remuxPercentage: number;
	transcodePercentage: number;
}

// Marathon types
export interface MarathonItem {
	itemId: string;
	itemName: string;
	itemType: string;
	startTime: Date;
	endTime: Date;
	durationMinutes: number;
}

export interface Marathon {
	startTime: Date;
	endTime: Date;
	totalMinutes: number;
	totalHours: number;
	items: MarathonItem[];
	itemCount: number;
	date: string; // Formatted date string
}

// Raw database row types
export interface PlaybackActivityRow {
	rowid?: number;
	DateCreated: string;
	UserId: string;
	ItemId: string;
	ItemType: string;
	ItemName: string;
	PlaybackMethod: string;
	ClientName: string;
	DeviceName: string;
	PlayDuration: number;
}

export interface UserRow {
	Id: string;
	Username: string;
}

export interface BaseItemRow {
	Id: string;
	Name: string;
	Type: string;
	SeriesName?: string;
}

export interface ProviderRow {
	ItemId: string;
	ProviderId: string;
	ProviderValue: string;
}

// TMDB types
export interface TmdbSeason {
	id: number;
	season_number: number;
	episode_count: number;
	name: string;
}

export interface TmdbItem {
	id: number;
	title?: string;
	name?: string;
	poster_path: string | null;
	backdrop_path: string | null;
	overview: string;
	vote_average: number;
	release_date?: string;
	first_air_date?: string;
	runtime?: number; // Movie runtime in minutes
	episode_run_time?: number[]; // TV show average episode runtime in minutes
	number_of_seasons?: number; // TV show total seasons
	number_of_episodes?: number; // TV show total episodes
	seasons?: TmdbSeason[]; // TV show season details
}

// Personality type - expanded with fun titles
export type Personality =
	| "Night Owl"
	| "Early Bird"
	| "Binge Watcher"
	| "Movie Buff"
	| "Casual Viewer"
	| "Marathon Master"
	| "Weekend Warrior"
	| "Workday Slacker"
	| "Lunch Break Legend"
	| "After Hours Addict"
	| "Sunday Couch Potato"
	| "Twilight Viewer"
	| "The Dedicated One"
	| "Prime Time Purist";
