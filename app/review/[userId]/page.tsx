import { notFound, redirect } from "next/navigation";
import { YearInReview } from "@/components/review/YearInReview";
import {
	getJellyfinTimezone,
	getJellyfinUsername,
	getSession,
	getSsoDisplayName,
	isAdmin,
} from "@/lib/auth";
import { findItemById, findSeriesByName } from "@/lib/dao";
import { determinePersonality, getItemUrl, normalizeId } from "@/lib/helpers";
import {
	getAbandonedMovies,
	getAuthentikUserByJellyfinUsername,
	getAvailableYears,
	getClientStats,
	getDayOfWeekStats,
	getDeviceStats,
	getFinishedMovieCount,
	getHourlyStats,
	getLongestMarathon,
	getMonthlyStats,
	getMovieDetails,
	getMovieDetailsByName,
	getPlaybackMethodStats,
	getPlaybackStats,
	getPosterUrl,
	getTopGenres,
	getTopMovies,
	getTopShows,
	getTvShowDetails,
	getTvShowDetailsByName,
	getUserById,
	getUserByUsername,
	getUserComparison,
	getUserRanking,
} from "@/lib/services";

interface PageProps {
	params: Promise<{ userId: string }>;
	searchParams: Promise<{ year?: string }>;
}

export default async function ReviewPage({ params, searchParams }: PageProps) {
	const { userId } = await params;
	const { year: yearParam } = await searchParams;

	// Check authentication
	const session = await getSession();
	if (!session?.user) {
		redirect("/login");
	}

	// Get auth info
	const [adminAccess, ssoDisplayName, jellyfinUsername, jellyfinTimezone] =
		await Promise.all([
			isAdmin(),
			getSsoDisplayName(),
			getJellyfinUsername(),
			getJellyfinTimezone(),
		]);

	// Check access: admin can view any user, non-admin can only view their own
	let hasAccess = false;
	if (adminAccess) {
		hasAccess = true;
	} else if (jellyfinUsername) {
		// Check if the requested user matches the SSO user's Jellyfin account
		const currentUser = getUserByUsername(jellyfinUsername);
		if (currentUser) {
			// Compare normalized IDs
			hasAccess = normalizeId(currentUser.id) === normalizeId(userId);
		}
	}

	if (!hasAccess) {
		// Redirect to home, which will redirect to their own review
		redirect("/");
	}

	const user = getUserById(userId);
	if (!user) {
		notFound();
	}

	// Determine display name:
	// - If admin viewing another user: get name from Authentik for that user
	// - If viewing own review: use SSO display name
	let displayName = ssoDisplayName;
	const isImpersonating = adminAccess && jellyfinUsername !== user.username;

	// User timezone from SSO (or undefined to use default)
	let userTimezone = jellyfinTimezone || undefined;

	if (isImpersonating) {
		// Admin viewing another user - get that user's info from Authentik
		const authentikUser = await getAuthentikUserByJellyfinUsername(
			user.username,
		);
		if (authentikUser) {
			displayName = authentikUser.name;
			// Use the viewed user's timezone from Authentik
			userTimezone = authentikUser.timezone || undefined;
		} else {
			// Fallback to Jellyfin username if not found in Authentik
			displayName = user.username;
		}
	}

	const availableYears = getAvailableYears(userId);
	if (availableYears.length === 0) {
		return (
			<div className="min-h-screen gradient-mesh flex items-center justify-center p-4">
				<div className="glass rounded-2xl p-8 max-w-md text-center">
					<h1 className="text-2xl font-bold text-white mb-4">No Data Found</h1>
					<p className="text-muted-foreground">
						{user.username} doesn't have any playback activity recorded yet.
					</p>
				</div>
			</div>
		);
	}

	// Default to most recent year
	const year = yearParam ? Number.parseInt(yearParam, 10) : availableYears[0];

	if (!availableYears.includes(year)) {
		redirect(`/review/${userId}?year=${availableYears[0]}`);
	}

	// Fetch all stats including marathon data
	const [
		stats,
		topMovies,
		topShows,
		abandonedMovies,
		finishedMovieCount,
		topGenres,
		hourlyStats,
		dayOfWeekStats,
		monthlyStats,
		deviceStats,
		clientStats,
		playbackMethodStats,
		longestMarathon,
		userRanking,
		userComparison,
	] = await Promise.all([
		getPlaybackStats(userId, year),
		getTopMovies(userId, year, 5),
		getTopShows(userId, year, 5),
		getAbandonedMovies(userId, year, 8),
		getFinishedMovieCount(userId, year),
		getTopGenres(userId, year, 10),
		getHourlyStats(userId, year, userTimezone),
		getDayOfWeekStats(userId, year, userTimezone),
		getMonthlyStats(userId, year, userTimezone),
		getDeviceStats(userId, year),
		getClientStats(userId, year),
		getPlaybackMethodStats(userId, year),
		getLongestMarathon(userId, year, userTimezone),
		getUserRanking(userId, year),
		getUserComparison(userId, year),
	]);

	// Fetch TMDB data for top items
	const topMoviesWithPostersUnsorted = await Promise.all(
		topMovies.map(async (movie) => {
			let tmdbData = null;

			// Check if movie still exists in Jellyfin
			const existsInJellyfin = !!findItemById(movie.itemId);

			// Try to get TMDB data by ID first
			if (movie.tmdbId) {
				tmdbData = await getMovieDetails(movie.tmdbId);
			}

			// Fallback: search by name if no TMDB ID or lookup failed
			// (handles items removed from Jellyfin but still in playback history)
			if (!tmdbData) {
				tmdbData = await getMovieDetailsByName(movie.itemName);
			}

			// Recalculate plays using TMDB runtime if available
			// This is needed for deleted movies where local runtime is unavailable
			let plays = movie.plays;
			if (tmdbData?.runtime && tmdbData.runtime > 0) {
				const runtimeMinutes = tmdbData.runtime;
				const calculatedPlays = movie.totalMinutes / runtimeMinutes;
				// Only use TMDB runtime if it gives a different (likely more accurate) result
				// This happens when local runtime was unavailable and session count was used
				if (Math.abs(calculatedPlays - movie.plays) > 0.5) {
					plays = Math.round(calculatedPlays * 10) / 10;
				}
			}

			// Get the appropriate URL (Jellyfin if exists, otherwise Seer)
			const tmdbId = movie.tmdbId || (tmdbData ? String(tmdbData.id) : null);
			const itemUrl = getItemUrl(
				movie.itemId,
				tmdbId,
				"movie",
				existsInJellyfin,
			);

			return {
				...movie,
				plays,
				posterUrl: tmdbData
					? getPosterUrl(tmdbData.poster_path)
					: "/placeholder-poster.svg",
				backdropUrl: tmdbData
					? getPosterUrl(tmdbData.backdrop_path, "w780")
					: null,
				rating: tmdbData?.vote_average ?? null,
				existsInJellyfin,
				itemUrl,
			};
		}),
	);

	// Re-sort after TMDB play recalculation (plays may have changed for deleted items)
	const topMoviesWithPosters = topMoviesWithPostersUnsorted.sort((a, b) => {
		const playsDiff = b.plays - a.plays;
		if (Math.abs(playsDiff) > 0.1) return playsDiff;
		return b.totalMinutes - a.totalMinutes;
	});

	const topShowsWithPostersUnsorted = await Promise.all(
		topShows.map(async (show) => {
			let tmdbData = null;

			// Check if show still exists in Jellyfin (check by series name)
			const seriesName = show.seriesName || show.itemName;
			const existsInJellyfin = !!findSeriesByName(seriesName);

			// Try to get TMDB data by ID first
			if (show.tmdbId) {
				tmdbData = await getTvShowDetails(show.tmdbId);
			}

			// Fallback: search by name if no TMDB ID or lookup failed
			// (handles items removed from Jellyfin but still in playback history)
			if (!tmdbData) {
				tmdbData = await getTvShowDetailsByName(show.itemName);
			}

			// Recalculate plays using TMDB episode runtime if available
			// This is needed for deleted shows where local runtime is unavailable
			let plays = show.plays;
			if (tmdbData?.episode_run_time && tmdbData.episode_run_time.length > 0) {
				// Use average episode runtime from TMDB
				const avgRuntimeMinutes =
					tmdbData.episode_run_time.reduce((a, b) => a + b, 0) /
					tmdbData.episode_run_time.length;
				if (avgRuntimeMinutes > 0) {
					const calculatedPlays = show.totalMinutes / avgRuntimeMinutes;
					// Only use TMDB runtime if it gives a different (likely more accurate) result
					if (Math.abs(calculatedPlays - show.plays) > 0.5) {
						plays = Math.round(calculatedPlays * 10) / 10;
					}
				}
			}

			// Get the appropriate URL (Jellyfin if exists, otherwise Seer)
			const tmdbId = show.tmdbId || (tmdbData ? String(tmdbData.id) : null);
			const itemUrl = getItemUrl(show.itemId, tmdbId, "tv", existsInJellyfin);

			// Calculate seasons completed based on TMDB data
			// Filter out season 0 (specials) when calculating
			const regularSeasons =
				tmdbData?.seasons?.filter((s) => s.season_number > 0) || [];
			const totalEpisodesInShow = regularSeasons.reduce(
				(sum, s) => sum + s.episode_count,
				0,
			);

			// Find how many full seasons were completed
			let seasonsCompleted = 0;
			let episodesAccountedFor = plays;
			for (const season of regularSeasons.sort(
				(a, b) => a.season_number - b.season_number,
			)) {
				if (episodesAccountedFor >= season.episode_count * 0.9) {
					// 90% threshold
					seasonsCompleted++;
					episodesAccountedFor -= season.episode_count;
				} else {
					break;
				}
			}

			// Average episodes per season for this show
			const avgEpisodesPerSeason =
				regularSeasons.length > 0
					? totalEpisodesInShow / regularSeasons.length
					: null;

			return {
				...show,
				plays,
				posterUrl: tmdbData
					? getPosterUrl(tmdbData.poster_path)
					: "/placeholder-poster.svg",
				backdropUrl: tmdbData
					? getPosterUrl(tmdbData.backdrop_path, "w780")
					: null,
				rating: tmdbData?.vote_average ?? null,
				existsInJellyfin,
				itemUrl,
				seasonsCompleted,
				totalSeasons: tmdbData?.number_of_seasons ?? null,
				avgEpisodesPerSeason,
			};
		}),
	);

	// Re-sort after TMDB play recalculation (plays may have changed for deleted items)
	const topShowsWithPosters = topShowsWithPostersUnsorted.sort((a, b) => {
		const playsDiff = b.plays - a.plays;
		if (Math.abs(playsDiff) > 0.5) return playsDiff;
		return b.totalMinutes - a.totalMinutes;
	});

	// Fetch TMDB data for abandoned movies (plays here is completion percentage)
	const abandonedMoviesWithPosters = await Promise.all(
		abandonedMovies.map(async (movie) => {
			let tmdbData = null;

			// Check if movie still exists in Jellyfin
			const existsInJellyfin = !!findItemById(movie.itemId);

			// Try to get TMDB data by ID first
			if (movie.tmdbId) {
				tmdbData = await getMovieDetails(movie.tmdbId);
			}

			// Fallback: search by name if no TMDB ID or lookup failed
			if (!tmdbData) {
				tmdbData = await getMovieDetailsByName(movie.itemName);
			}

			// Get the appropriate URL (Jellyfin if exists, otherwise Seer)
			const tmdbId = movie.tmdbId || (tmdbData ? String(tmdbData.id) : null);
			const itemUrl = getItemUrl(
				movie.itemId,
				tmdbId,
				"movie",
				existsInJellyfin,
			);

			return {
				...movie,
				completionPercent: movie.plays, // plays is already percentage for abandoned movies
				posterUrl: tmdbData
					? getPosterUrl(tmdbData.poster_path)
					: "/placeholder-poster.svg",
				backdropUrl: tmdbData
					? getPosterUrl(tmdbData.backdrop_path, "w780")
					: null,
				rating: tmdbData?.vote_average ?? null,
				existsInJellyfin,
				itemUrl,
			};
		}),
	);

	// Calculate personality based on watching habits and marathon data
	const personality = determinePersonality({
		hourlyStats,
		dayOfWeekStats,
		stats,
		longestMarathon,
	});

	return (
		<YearInReview
			user={user}
			year={year}
			availableYears={availableYears}
			stats={stats}
			topMovies={topMoviesWithPosters}
			topShows={topShowsWithPosters}
			abandonedMovies={abandonedMoviesWithPosters}
			finishedMovieCount={finishedMovieCount}
			topGenres={topGenres}
			hourlyStats={hourlyStats}
			dayOfWeekStats={dayOfWeekStats}
			monthlyStats={monthlyStats}
			deviceStats={deviceStats}
			clientStats={clientStats}
			playbackMethodStats={playbackMethodStats}
			personality={personality}
			longestMarathon={longestMarathon}
			userRanking={userRanking}
			userComparison={userComparison}
			isAdmin={adminAccess}
			displayName={displayName}
			timezone={userTimezone}
		/>
	);
}
