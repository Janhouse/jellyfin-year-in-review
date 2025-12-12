import { redirect } from "next/navigation";
import { ServerStatsView } from "@/components/review/ServerStatsView";
import {
	getMovieDetails,
	getMovieDetailsByName,
	getPosterUrl,
	getServerAvailableYears,
	getServerStats,
	getServerTopMovies,
	getServerTopShows,
	getTvShowDetails,
	getTvShowDetailsByName,
} from "@/lib/services";

interface PageProps {
	searchParams: Promise<{ year?: string }>;
}

export default async function ServerStatsPage({ searchParams }: PageProps) {
	const { year: yearParam } = await searchParams;

	const availableYears = getServerAvailableYears();
	if (availableYears.length === 0) {
		return (
			<div className="min-h-screen gradient-mesh flex items-center justify-center p-4">
				<div className="glass rounded-2xl p-8 max-w-md text-center">
					<h1 className="text-2xl font-bold text-white mb-4">No Data Found</h1>
					<p className="text-muted-foreground">
						No playback activity has been recorded yet.
					</p>
				</div>
			</div>
		);
	}

	// Default to most recent year
	const year = yearParam ? Number.parseInt(yearParam, 10) : availableYears[0];

	if (!availableYears.includes(year)) {
		redirect(`/stats?year=${availableYears[0]}`);
	}

	const [stats, topMovies, topShows] = await Promise.all([
		getServerStats(year),
		getServerTopMovies(year, 5),
		getServerTopShows(year, 5),
	]);

	// Fetch poster data for movies
	const topMoviesWithPosters = await Promise.all(
		topMovies.map(async (movie) => {
			let tmdbData = null;

			if (movie.tmdbId) {
				tmdbData = await getMovieDetails(movie.tmdbId);
			}

			if (!tmdbData) {
				tmdbData = await getMovieDetailsByName(movie.itemName);
			}

			return {
				...movie,
				posterUrl: tmdbData
					? getPosterUrl(tmdbData.poster_path)
					: "/placeholder-poster.svg",
			};
		}),
	);

	// Fetch poster data for shows
	const topShowsWithPosters = await Promise.all(
		topShows.map(async (show) => {
			let tmdbData = null;

			if (show.tmdbId) {
				tmdbData = await getTvShowDetails(show.tmdbId);
			}

			if (!tmdbData) {
				tmdbData = await getTvShowDetailsByName(show.seriesName);
			}

			return {
				...show,
				posterUrl: tmdbData
					? getPosterUrl(tmdbData.poster_path)
					: "/placeholder-poster.svg",
			};
		}),
	);

	return (
		<ServerStatsView
			year={year}
			availableYears={availableYears}
			stats={stats}
			topMovies={topMoviesWithPosters}
			topShows={topShowsWithPosters}
		/>
	);
}
