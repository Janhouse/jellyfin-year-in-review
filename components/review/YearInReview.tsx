"use client";

import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import {
	ChevronLeft,
	ChevronRight,
	Settings,
	Video,
	VideoOff,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@/lib/data/users";
import { useStreamerMode } from "@/lib/hooks/useStreamerMode";
import type { GenreStats, UserComparison, UserRanking } from "@/lib/services";
import type {
	ClientStats,
	DayOfWeekStats,
	DeviceStats,
	HourlyStats,
	Marathon,
	MonthlyStats,
	Personality,
	PlaybackMethodStats,
	PlaybackStats,
} from "@/lib/types";
import { AbandonedMoviesSlide } from "./slides/AbandonedMoviesSlide";
import { ComparisonSlide } from "./slides/ComparisonSlide";
import { MarathonSlide } from "./slides/MarathonSlide";
import { MonthlyJourneySlide } from "./slides/MonthlyJourneySlide";
import { NoMoviesSlide } from "./slides/NoMoviesSlide";
import { ServerMilestoneSlide } from "./slides/ServerMilestoneSlide";
import { SummarySlide } from "./slides/SummarySlide";
import { TechStatsSlide } from "./slides/TechStatsSlide";
import { TopGenresSlide } from "./slides/TopGenresSlide";
import { TopMovieSlide } from "./slides/TopMovieSlide";
import { TopMoviesSlide } from "./slides/TopMoviesSlide";
import { TopShowSlide } from "./slides/TopShowSlide";
import { TopShowsSlide } from "./slides/TopShowsSlide";
import { TotalTimeSlide } from "./slides/TotalTimeSlide";
import { WatchingHabitsSlide } from "./slides/WatchingHabitsSlide";
import { WelcomeSlide } from "./slides/WelcomeSlide";
import { YearSelector } from "./YearSelector";

interface TopItemWithPoster {
	itemId: string;
	itemName: string;
	itemType: string;
	plays: number;
	totalMinutes: number;
	tmdbId: string | null;
	posterUrl: string;
	backdropUrl: string | null;
	rating: number | null;
	seriesName?: string;
	existsInJellyfin: boolean;
	itemUrl: string | null;
	// Show-specific fields
	seasonsCompleted?: number;
	totalSeasons?: number | null;
	avgEpisodesPerSeason?: number | null;
}

interface AbandonedMovieWithPoster {
	itemId: string;
	itemName: string;
	itemType: string;
	completionPercent: number;
	totalMinutes: number;
	tmdbId: string | null;
	posterUrl: string;
	backdropUrl: string | null;
	rating: number | null;
	existsInJellyfin: boolean;
	itemUrl: string | null;
}

interface YearInReviewProps {
	user: User;
	year: number;
	availableYears: number[];
	stats: PlaybackStats;
	topMovies: TopItemWithPoster[];
	topShows: TopItemWithPoster[];
	abandonedMovies: AbandonedMovieWithPoster[];
	finishedMovieCount: number;
	topGenres: GenreStats[];
	hourlyStats: HourlyStats[];
	dayOfWeekStats: DayOfWeekStats[];
	monthlyStats: MonthlyStats[];
	deviceStats: DeviceStats[];
	clientStats: ClientStats[];
	playbackMethodStats: PlaybackMethodStats;
	personality: Personality;
	longestMarathon: Marathon | null;
	userRanking: UserRanking;
	userComparison: UserComparison;
	isAdmin: boolean;
	displayName: string | null;
	timezone?: string;
}

export function YearInReview({
	user,
	year,
	availableYears,
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
	personality,
	longestMarathon,
	userRanking,
	userComparison,
	isAdmin,
	displayName,
	timezone,
}: YearInReviewProps) {
	// Use SSO display name if available, otherwise fall back to Jellyfin username
	// Extract first name from display name (split on space and take first part)
	const fullName = displayName || user.username;
	const firstName = fullName.split(" ")[0];
	const [currentSlide, setCurrentSlide] = useState(0);
	const [direction, setDirection] = useState(0);
	const [hoveredSlide, setHoveredSlide] = useState<number | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const { isStreamerMode, toggleStreamerMode } = useStreamerMode();

	// Calculate total slides based on available data
	const hasMarathon = longestMarathon && longestMarathon.itemCount >= 2;
	const is2025 = year === 2025;
	const hasAbandonedMovies = abandonedMovies.length > 0;
	const hasShows = topShows.length > 0;
	const hasGenres = topGenres.length > 0;

	// Determine movie slide scenario:
	// 1. finishedMovieCount > 0: Show normal top movie slides
	// 2. finishedMovieCount === 0 but hasAbandonedMovies: Show "no movies finished" + abandoned movies
	// 3. No finished movies and no abandoned: No movie slides at all
	const hasFinishedMovies = finishedMovieCount > 0;
	const showNormalMovieSlides = hasFinishedMovies && topMovies.length > 0;
	const showNoMoviesSlide = !hasFinishedMovies && hasAbandonedMovies;
	const showAbandonedSlide = hasAbandonedMovies && finishedMovieCount <= 2;

	// Build slide titles array dynamically (must match renderSlide order exactly)
	// Also track genres slide index for navigation
	const { slideTitles, genresSlideIndex } = useMemo(() => {
		const titles: string[] = ["Welcome", "Total Watch Time"];
		let genresIdx = -1;

		if (showNormalMovieSlides) {
			titles.push("Top Movie", "Top Movies");
		}
		if (showNoMoviesSlide) {
			titles.push("Movies");
		}
		if (showAbandonedSlide) {
			titles.push("Almost Finished");
		}
		if (hasShows) {
			titles.push("Top Show", "Top Shows");
		}
		if (hasGenres) {
			genresIdx = titles.length;
			titles.push("Top Genres");
		}
		titles.push("Watching Habits");
		if (hasMarathon) {
			titles.push("Marathon");
		}
		titles.push("Tech Stats", "Monthly Journey", "Server Comparison");
		if (is2025) {
			titles.push("Server Milestone");
		}
		titles.push("Summary");

		return { slideTitles: titles, genresSlideIndex: genresIdx };
	}, [
		showNormalMovieSlides,
		showNoMoviesSlide,
		showAbandonedSlide,
		hasShows,
		hasGenres,
		hasMarathon,
		is2025,
	]);

	// Base: 7 slides (welcome, total, habits, tech, monthly, comparison, summary)
	// +2 for movies (top movie, top movies list) OR +1 for no movies slide, +1 for abandoned
	// +2 for shows (top show, top shows list)
	// +1 for genres, +1 for marathon, +1 for 2025 milestone
	const TOTAL_SLIDES =
		7 +
		(showNormalMovieSlides ? 2 : 0) +
		(showNoMoviesSlide ? 1 : 0) +
		(showAbandonedSlide ? 1 : 0) +
		(hasShows ? 2 : 0) +
		(hasGenres ? 1 : 0) +
		(hasMarathon ? 1 : 0) +
		(is2025 ? 1 : 0);

	const goToSlide = useCallback(
		(index: number) => {
			if (index >= 0 && index < TOTAL_SLIDES && index !== currentSlide) {
				setDirection(index > currentSlide ? 1 : -1);
				setCurrentSlide(index);
			}
		},
		[currentSlide, TOTAL_SLIDES],
	);

	const nextSlide = useCallback(() => {
		if (currentSlide < TOTAL_SLIDES - 1) {
			setDirection(1);
			setCurrentSlide((prev) => prev + 1);
		}
	}, [currentSlide, TOTAL_SLIDES]);

	const prevSlide = useCallback(() => {
		if (currentSlide > 0) {
			setDirection(-1);
			setCurrentSlide((prev) => prev - 1);
		}
	}, [currentSlide]);

	// Keyboard navigation (horizontal)
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") {
				e.preventDefault();
				nextSlide();
			} else if (e.key === "ArrowLeft") {
				e.preventDefault();
				prevSlide();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [nextSlide, prevSlide]);

	// Handle swipe gestures
	const handleDragEnd = useCallback(
		(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
			const threshold = 50;
			const velocity = 500;

			if (info.offset.x < -threshold || info.velocity.x < -velocity) {
				nextSlide();
			} else if (info.offset.x > threshold || info.velocity.x > velocity) {
				prevSlide();
			}
		},
		[nextSlide, prevSlide],
	);

	// Horizontal slide variants
	const slideVariants = {
		enter: (direction: number) => ({
			x: direction > 0 ? "100%" : "-100%",
			opacity: 0,
		}),
		center: {
			x: 0,
			opacity: 1,
		},
		exit: (direction: number) => ({
			x: direction > 0 ? "-100%" : "100%",
			opacity: 0,
		}),
	};

	const renderSlide = () => {
		// Build slides array dynamically based on available data
		const slides: React.ReactNode[] = [
			<WelcomeSlide
				key="welcome"
				userName={firstName}
				year={year}
				onNext={nextSlide}
				isStreamerMode={isStreamerMode}
			/>,
			<TotalTimeSlide
				key="total"
				stats={stats}
				year={year}
				userRanking={userRanking}
				userComparison={userComparison}
			/>,
		];

		// Add movie slides if user has finished movies
		if (showNormalMovieSlides) {
			slides.push(
				<TopMovieSlide key="topmovie" movie={topMovies[0]} />,
				<TopMoviesSlide key="topmovies" movies={topMovies} />,
			);
		}

		// Show "no movies finished" slide if user only has abandoned movies
		if (showNoMoviesSlide) {
			slides.push(<NoMoviesSlide key="nomovies" />);
		}

		// Show abandoned movies slide if user has many unfinished movies
		if (showAbandonedSlide) {
			slides.push(
				<AbandonedMoviesSlide key="abandoned" movies={abandonedMovies} />,
			);
		}

		// Add show slides if user has watched shows
		if (hasShows) {
			slides.push(
				<TopShowSlide key="topshow" show={topShows[0]} />,
				<TopShowsSlide key="topshows" shows={topShows} />,
			);
		}

		// Add genres slide if user has genre data
		if (hasGenres) {
			slides.push(<TopGenresSlide key="genres" genres={topGenres} />);
		}

		// Watching habits
		slides.push(
			<WatchingHabitsSlide
				key="habits"
				hourlyStats={hourlyStats}
				dayOfWeekStats={dayOfWeekStats}
				personality={personality}
			/>,
		);

		// Add marathon slide if available
		if (hasMarathon && longestMarathon) {
			slides.push(
				<MarathonSlide
					key="marathon"
					marathon={longestMarathon}
					timezone={timezone}
				/>,
			);
		}

		// Continue with remaining slides
		slides.push(
			<TechStatsSlide
				key="tech"
				deviceStats={deviceStats}
				clientStats={clientStats}
				playbackMethodStats={playbackMethodStats}
				isStreamerMode={isStreamerMode}
			/>,
			<MonthlyJourneySlide
				key="monthly"
				monthlyStats={monthlyStats}
				year={year}
			/>,
			<ComparisonSlide key="comparison" comparison={userComparison} />,
		);

		// Add 2025 milestone slide if applicable
		if (is2025) {
			slides.push(<ServerMilestoneSlide key="milestone" />);
		}

		// Summary slide is always last
		slides.push(
			<SummarySlide
				key="summary"
				userName={firstName}
				year={year}
				stats={stats}
				topMovie={topMovies[0]}
				topShow={topShows[0]}
				topGenre={topGenres[0]?.genre || null}
				onGenreClick={
					genresSlideIndex >= 0 ? () => goToSlide(genresSlideIndex) : undefined
				}
				personality={personality}
				playbackMethodStats={playbackMethodStats}
				userComparison={userComparison}
				isStreamerMode={isStreamerMode}
			/>,
		);

		return slides[currentSlide] || null;
	};

	return (
		<div
			ref={containerRef}
			className="fixed inset-0 gradient-mesh overflow-hidden"
		>
			{/* Instagram-style progress bars at top */}
			<div className="absolute top-0 left-0 right-0 z-50 px-2 pt-2 pb-1 bg-gradient-to-b from-black/50 to-transparent">
				<div className="flex gap-1 relative">
					{Array.from({ length: TOTAL_SLIDES }, (_, i) => (
						<button
							type="button"
							// biome-ignore lint/suspicious/noArrayIndexKey: Slide count is static and never reorders
							key={`slide-${i}`}
							onClick={(e) => {
								e.stopPropagation();
								goToSlide(i);
							}}
							onMouseEnter={() => setHoveredSlide(i)}
							onMouseLeave={() => setHoveredSlide(null)}
							className="flex-1 h-5 flex items-center relative"
							aria-label={`Go to slide ${i + 1}: ${slideTitles[i]}`}
						>
							<div className="w-full h-1 rounded-full overflow-hidden bg-white/30 transition-all hover:bg-white/40">
								<motion.div
									className="h-full bg-white rounded-full"
									initial={false}
									animate={{
										width:
											i < currentSlide
												? "100%"
												: i === currentSlide
													? "100%"
													: "0%",
									}}
									transition={{
										duration: i === currentSlide ? 0.3 : 0,
										ease: "easeOut",
									}}
								/>
							</div>
						</button>
					))}

					{/* Tooltip balloon */}
					<AnimatePresence>
						{hoveredSlide !== null && (
							<motion.div
								initial={{ opacity: 0, y: -5 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -5 }}
								transition={{ duration: 0.15 }}
								className="absolute top-full mt-2 px-3 py-1.5 bg-black/80 backdrop-blur-sm text-white text-xs font-medium rounded-lg whitespace-nowrap pointer-events-none"
								style={{
									left: `${((hoveredSlide + 0.5) / TOTAL_SLIDES) * 100}%`,
									transform: "translateX(-50%)",
								}}
							>
								{slideTitles[hoveredSlide]}
								<div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black/80 rotate-45" />
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				{/* Year selector and admin link in header */}
				<div className="flex justify-end items-center gap-2 mt-2 pr-1">
					{isAdmin && (
						<button
							type="button"
							onClick={toggleStreamerMode}
							className={`flex items-center gap-1 px-2 py-1 text-xs rounded-lg transition-all ${
								isStreamerMode
									? "text-purple-300 bg-purple-500/30 hover:bg-purple-500/40 border border-purple-500/50"
									: "text-white/60 hover:text-white bg-white/10 hover:bg-white/20"
							}`}
							title={
								isStreamerMode
									? "Disable streamer mode"
									: "Enable streamer mode"
							}
						>
							{isStreamerMode ? (
								<VideoOff className="w-3 h-3" />
							) : (
								<Video className="w-3 h-3" />
							)}
							<span className="hidden sm:inline">Streamer</span>
						</button>
					)}
					{isAdmin && (
						<Link
							href="/admin"
							className="flex items-center gap-1 px-2 py-1 text-xs text-white/60 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-all"
						>
							<Settings className="w-3 h-3" />
							Admin
						</Link>
					)}
					<YearSelector
						currentYear={year}
						availableYears={availableYears}
						userId={user.normalizedId}
					/>
				</div>
			</div>

			{/* Slide counter */}
			<div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 text-white/60 text-sm font-medium">
				{currentSlide + 1} / {TOTAL_SLIDES}
			</div>

			{/* Navigation buttons */}
			{currentSlide > 0 && (
				<button
					type="button"
					onClick={prevSlide}
					className="absolute left-2 top-1/2 -translate-y-1/2 z-40 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white transition-all"
					aria-label="Previous slide"
				>
					<ChevronLeft className="w-6 h-6" />
				</button>
			)}
			{currentSlide < TOTAL_SLIDES - 1 && (
				<button
					type="button"
					onClick={nextSlide}
					className="absolute right-2 top-1/2 -translate-y-1/2 z-40 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white transition-all"
					aria-label="Next slide"
				>
					<ChevronRight className="w-6 h-6" />
				</button>
			)}

			{/* Slides with swipe gesture support */}
			<AnimatePresence mode="wait" custom={direction}>
				<motion.div
					key={currentSlide}
					custom={direction}
					variants={slideVariants}
					initial="enter"
					animate="center"
					exit="exit"
					transition={{
						x: { type: "spring", stiffness: 300, damping: 30 },
						opacity: { duration: 0.2 },
					}}
					drag="x"
					dragConstraints={{ left: 0, right: 0 }}
					dragElastic={0.2}
					onDragEnd={handleDragEnd}
					className="absolute inset-0 pt-20 pb-12 overflow-y-auto overflow-x-hidden"
				>
					<div className="min-h-full flex items-center justify-center px-4">
						<div className="w-full max-w-5xl">{renderSlide()}</div>
					</div>
				</motion.div>
			</AnimatePresence>
		</div>
	);
}
