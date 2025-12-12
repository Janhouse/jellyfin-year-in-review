import {
	findAllUserHoursForYear,
	findAllUsersMovieHours,
	findAllUsersPlaybackMethods,
	findAllUsersShowHours,
	findAllUsersUniqueMovies,
	findAllUsersUniqueShows,
} from "@/lib/dao";
import { normalizeId } from "@/lib/helpers";

/**
 * Comparison Service
 * Calculate how a user compares to other users
 */

export interface UserComparison {
	// Total watch time
	totalHours: number;
	totalHoursRank: number;
	totalHoursPercentile: number;
	avgTotalHours: number;
	maxTotalHours: number;

	// Movies
	movieHours: number;
	movieHoursRank: number;
	movieHoursPercentile: number;
	avgMovieHours: number;
	maxMovieHours: number;
	uniqueMovies: number;
	uniqueMoviesRank: number;
	uniqueMoviesPercentile: number;
	avgUniqueMovies: number;
	maxUniqueMovies: number;

	// Shows
	showHours: number;
	showHoursRank: number;
	showHoursPercentile: number;
	avgShowHours: number;
	maxShowHours: number;
	uniqueShows: number;
	uniqueShowsRank: number;
	uniqueShowsPercentile: number;
	avgUniqueShows: number;
	maxUniqueShows: number;

	// Playback methods
	directPercentage: number;
	avgDirectPercentage: number;
	directRank: number;
	remuxPercentage: number;
	avgRemuxPercentage: number;
	remuxRank: number;
	transcodePercentage: number;
	avgTranscodePercentage: number;
	transcodeRank: number;
	serverFriendlinessRank: number;
	serverFriendlinessPercentile: number;

	// Meta
	totalUsers: number;
}

function calculatePercentile(rank: number, total: number): number {
	if (total <= 1) return 100;
	return Math.round(((total - rank) / (total - 1)) * 100);
}

function calculateRank<T>(
	data: T[],
	userId: string,
	getIdFn: (item: T) => string,
): number {
	const index = data.findIndex((item) => getIdFn(item) === userId);
	return index >= 0 ? index + 1 : data.length + 1;
}

function calculateAverage(data: number[]): number {
	if (data.length === 0) return 0;
	return data.reduce((sum, val) => sum + val, 0) / data.length;
}

/**
 * Get comprehensive comparison stats for a user
 */
export function getUserComparison(
	userId: string,
	year: number,
): UserComparison {
	const normalizedUserId = normalizeId(userId);

	// Fetch all data
	const allHours = findAllUserHoursForYear(year);
	const allMovieHours = findAllUsersMovieHours(year);
	const allShowHours = findAllUsersShowHours(year);
	const allUniqueMovies = findAllUsersUniqueMovies(year);
	const allUniqueShows = findAllUsersUniqueShows(year);
	const allPlaybackMethods = findAllUsersPlaybackMethods(year);

	const totalUsers = allHours.length;

	// User's stats
	const userHours = allHours.find((u) => u.userId === normalizedUserId);
	const userMovieHours = allMovieHours.find(
		(u) => u.userId === normalizedUserId,
	);
	const userShowHours = allShowHours.find((u) => u.userId === normalizedUserId);
	const userUniqueMovies = allUniqueMovies.find(
		(u) => u.userId === normalizedUserId,
	);
	const userUniqueShows = allUniqueShows.find(
		(u) => u.userId === normalizedUserId,
	);
	const userPlaybackMethods = allPlaybackMethods.find(
		(u) => u.userId === normalizedUserId,
	);

	// Calculate playback method percentages for user
	const userTotal =
		(userPlaybackMethods?.direct || 0) +
		(userPlaybackMethods?.remux || 0) +
		(userPlaybackMethods?.transcode || 0);
	const userDirectPct =
		userTotal > 0
			? Math.round(((userPlaybackMethods?.direct || 0) / userTotal) * 1000) / 10
			: 0;
	const userRemuxPct =
		userTotal > 0
			? Math.round(((userPlaybackMethods?.remux || 0) / userTotal) * 1000) / 10
			: 0;
	const userTranscodePct =
		userTotal > 0
			? Math.round(((userPlaybackMethods?.transcode || 0) / userTotal) * 1000) /
				10
			: 0;

	// Calculate average playback method percentages
	const allDirectPcts: number[] = [];
	const allRemuxPcts: number[] = [];
	const allTranscodePcts: number[] = [];

	for (const pm of allPlaybackMethods) {
		const total = pm.direct + pm.remux + pm.transcode;
		if (total > 0) {
			allDirectPcts.push((pm.direct / total) * 100);
			allRemuxPcts.push((pm.remux / total) * 100);
			allTranscodePcts.push((pm.transcode / total) * 100);
		}
	}

	// Calculate per-method rankings (higher percentage = better rank)
	const directScores = allPlaybackMethods
		.map((pm) => {
			const total = pm.direct + pm.remux + pm.transcode;
			return {
				userId: pm.userId,
				score: total > 0 ? (pm.direct / total) * 100 : 0,
			};
		})
		.sort((a, b) => b.score - a.score);

	const remuxScores = allPlaybackMethods
		.map((pm) => {
			const total = pm.direct + pm.remux + pm.transcode;
			return {
				userId: pm.userId,
				score: total > 0 ? (pm.remux / total) * 100 : 0,
			};
		})
		.sort((a, b) => b.score - a.score);

	const transcodeScores = allPlaybackMethods
		.map((pm) => {
			const total = pm.direct + pm.remux + pm.transcode;
			return {
				userId: pm.userId,
				score: total > 0 ? (pm.transcode / total) * 100 : 0,
			};
		})
		.sort((a, b) => b.score - a.score);

	// Server friendliness = direct + remux percentage (higher is better)
	const serverFriendlinessScores = allPlaybackMethods
		.map((pm) => {
			const total = pm.direct + pm.remux + pm.transcode;
			return {
				userId: pm.userId,
				score: total > 0 ? ((pm.direct + pm.remux) / total) * 100 : 0,
			};
		})
		.sort((a, b) => b.score - a.score);

	const serverFriendlinessRank = calculateRank(
		serverFriendlinessScores,
		normalizedUserId,
		(item) => item.userId,
	);
	const directRank = calculateRank(
		directScores,
		normalizedUserId,
		(item) => item.userId,
	);
	const remuxRank = calculateRank(
		remuxScores,
		normalizedUserId,
		(item) => item.userId,
	);
	const transcodeRank = calculateRank(
		transcodeScores,
		normalizedUserId,
		(item) => item.userId,
	);

	return {
		// Total watch time
		totalHours: Math.round((userHours?.totalHours || 0) * 10) / 10,
		totalHoursRank: calculateRank(allHours, normalizedUserId, (u) => u.userId),
		totalHoursPercentile: calculatePercentile(
			calculateRank(allHours, normalizedUserId, (u) => u.userId),
			totalUsers,
		),
		avgTotalHours:
			Math.round(calculateAverage(allHours.map((u) => u.totalHours)) * 10) / 10,
		maxTotalHours: Math.round((allHours[0]?.totalHours || 0) * 10) / 10,

		// Movies
		movieHours: Math.round((userMovieHours?.movieHours || 0) * 10) / 10,
		movieHoursRank: calculateRank(
			allMovieHours,
			normalizedUserId,
			(u) => u.userId,
		),
		movieHoursPercentile: calculatePercentile(
			calculateRank(allMovieHours, normalizedUserId, (u) => u.userId),
			allMovieHours.length,
		),
		avgMovieHours:
			Math.round(
				calculateAverage(allMovieHours.map((u) => u.movieHours)) * 10,
			) / 10,
		maxMovieHours: Math.round((allMovieHours[0]?.movieHours || 0) * 10) / 10,
		uniqueMovies: userUniqueMovies?.uniqueMovies || 0,
		uniqueMoviesRank: calculateRank(
			allUniqueMovies,
			normalizedUserId,
			(u) => u.userId,
		),
		uniqueMoviesPercentile: calculatePercentile(
			calculateRank(allUniqueMovies, normalizedUserId, (u) => u.userId),
			allUniqueMovies.length,
		),
		avgUniqueMovies: Math.round(
			calculateAverage(allUniqueMovies.map((u) => u.uniqueMovies)),
		),
		maxUniqueMovies: allUniqueMovies[0]?.uniqueMovies || 0,

		// Shows
		showHours: Math.round((userShowHours?.showHours || 0) * 10) / 10,
		showHoursRank: calculateRank(
			allShowHours,
			normalizedUserId,
			(u) => u.userId,
		),
		showHoursPercentile: calculatePercentile(
			calculateRank(allShowHours, normalizedUserId, (u) => u.userId),
			allShowHours.length,
		),
		avgShowHours:
			Math.round(calculateAverage(allShowHours.map((u) => u.showHours)) * 10) /
			10,
		maxShowHours: Math.round((allShowHours[0]?.showHours || 0) * 10) / 10,
		uniqueShows: userUniqueShows?.uniqueShows || 0,
		uniqueShowsRank: calculateRank(
			allUniqueShows,
			normalizedUserId,
			(u) => u.userId,
		),
		uniqueShowsPercentile: calculatePercentile(
			calculateRank(allUniqueShows, normalizedUserId, (u) => u.userId),
			allUniqueShows.length,
		),
		avgUniqueShows: Math.round(
			calculateAverage(allUniqueShows.map((u) => u.uniqueShows)),
		),
		maxUniqueShows: allUniqueShows[0]?.uniqueShows || 0,

		// Playback methods
		directPercentage: userDirectPct,
		avgDirectPercentage: Math.round(calculateAverage(allDirectPcts) * 10) / 10,
		directRank,
		remuxPercentage: userRemuxPct,
		avgRemuxPercentage: Math.round(calculateAverage(allRemuxPcts) * 10) / 10,
		remuxRank,
		transcodePercentage: userTranscodePct,
		avgTranscodePercentage:
			Math.round(calculateAverage(allTranscodePcts) * 10) / 10,
		transcodeRank,
		serverFriendlinessRank,
		serverFriendlinessPercentile: calculatePercentile(
			serverFriendlinessRank,
			totalUsers,
		),

		// Meta
		totalUsers,
	};
}
