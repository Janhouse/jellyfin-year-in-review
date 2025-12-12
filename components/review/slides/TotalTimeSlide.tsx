"use client";

import { motion } from "framer-motion";
import { Award, Crown, Film, Medal, Star, Trophy, Tv } from "lucide-react";
import type { PlaybackStats } from "@/lib/data/playback";
import type { UserComparison, UserRanking } from "@/lib/services";
import { AnimatedNumber } from "../AnimatedNumber";

interface TotalTimeSlideProps {
	stats: PlaybackStats;
	year: number;
	userRanking: UserRanking;
	userComparison: UserComparison;
}

// Fun nominations based on watch time
function getViewerTitle(hours: number): {
	title: string;
	icon: React.ReactNode;
	color: string;
} {
	if (hours >= 1000) {
		return {
			title: "Legendary Viewer",
			icon: <Crown className="w-6 h-6" />,
			color: "text-amber-400",
		};
	}
	if (hours >= 500) {
		return {
			title: "Master Streamer",
			icon: <Trophy className="w-6 h-6" />,
			color: "text-yellow-400",
		};
	}
	if (hours >= 250) {
		return {
			title: "Dedicated Fan",
			icon: <Medal className="w-6 h-6" />,
			color: "text-orange-400",
		};
	}
	if (hours >= 100) {
		return {
			title: "Enthusiastic Viewer",
			icon: <Star className="w-6 h-6" />,
			color: "text-purple-400",
		};
	}
	if (hours >= 50) {
		return {
			title: "Rising Star",
			icon: <Award className="w-6 h-6" />,
			color: "text-blue-400",
		};
	}
	return {
		title: "Casual Explorer",
		icon: <Star className="w-6 h-6" />,
		color: "text-green-400",
	};
}

// Fun comparisons based on hours
// Work week = 40 hours, Calendar week = 168 hours (24 × 7)
function getFunComparison(hours: number): string {
	const workWeeks = hours / 40;
	const calendarWeeks = hours / 168;

	// 1000+ hours: use calendar weeks for "non-stop" context
	if (hours >= 1000) {
		return `Over ${Math.floor(calendarWeeks)} weeks of non-stop watching!`;
	}
	// 400+ hours: 10+ work weeks - impressive!
	if (hours >= 400) {
		return `That's ${Math.floor(workWeeks)} work weeks of entertainment!`;
	}
	// 168+ hours: 1+ calendar week = 4+ work weeks
	if (hours >= 168) {
		return `Over ${Math.floor(workWeeks)} work weeks of entertainment!`;
	}
	// 80+ hours: 2+ work weeks
	if (hours >= 80) {
		return `${Math.floor(workWeeks)} work weeks of pure entertainment!`;
	}
	// 40-79 hours: 1 work week
	if (hours >= 40) {
		return "At least a full work week of pure entertainment!";
	}
	// 10-39 hours: feature films
	if (hours >= 10) {
		return `${Math.floor(hours / 2)} feature films worth of content!`;
	}
	return "Quality over quantity - every minute counts!";
}

export function TotalTimeSlide({
	stats,
	year,
	userRanking,
	userComparison,
}: TotalTimeSlideProps) {
	const viewerTitle = getViewerTitle(stats.totalHours);
	const funComparison = getFunComparison(stats.totalHours);

	// Check if user is above average based on actual hours
	const isAboveAverage = stats.totalHours >= userComparison.avgTotalHours;

	// Only show ranking section for users who are above average or in top percentiles
	// Below-average users already get encouraging titles based on absolute hours
	const showRankingSection =
		userRanking.rank === 1 || userRanking.percentile >= 75 || isAboveAverage;

	// Calculate percentile message - only called if showRankingSection is true
	const getPercentileMessage = () => {
		if (userRanking.rank === 1) {
			return "You're the #1 viewer!";
		}
		if (userRanking.percentile >= 90) {
			return `Top ${100 - userRanking.percentile}% of viewers!`;
		}
		if (userRanking.percentile >= 75) {
			return `Top ${100 - userRanking.percentile}% of viewers`;
		}
		return "Above average viewer";
	};

	return (
		<div className="text-center max-w-3xl mx-auto">
			<motion.p
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				className="text-lg text-muted-foreground mb-4"
			>
				In {year}, you watched
			</motion.p>

			<motion.div
				initial={{ scale: 0.5, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
				className="mb-6"
			>
				<div className="flex items-baseline justify-center gap-2">
					<AnimatedNumber
						value={Math.round(stats.totalHours)}
						className="text-7xl md:text-9xl font-bold text-gradient"
					/>
					<span className="text-3xl text-white font-medium">hours</span>
				</div>

				{stats.totalDays >= 1 && (
					<motion.p
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 1 }}
						className="text-xl text-muted-foreground mt-4"
					>
						That's{" "}
						<span className="text-jellyfin font-semibold">
							{stats.totalDays.toFixed(1)} days
						</span>{" "}
						of content!
					</motion.p>
				)}
			</motion.div>

			{/* Viewer Title / Nomination */}
			<motion.div
				initial={{ opacity: 0, scale: 0.8 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ delay: 0.4, type: "spring" }}
				className="glass rounded-2xl p-6 mb-6"
			>
				<div
					className={`flex items-center justify-center gap-3 ${viewerTitle.color} mb-2`}
				>
					{viewerTitle.icon}
					<span className="text-2xl font-bold">{viewerTitle.title}</span>
				</div>
				<p className="text-muted-foreground">{funComparison}</p>
			</motion.div>

			{/* Ranking Section - only shown for above-average or top percentile users */}
			{userRanking.totalUsers > 1 && showRankingSection && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.6 }}
					className="glass rounded-2xl p-5 mb-6"
				>
					<div className="flex items-center justify-center gap-2 mb-3">
						{userRanking.rank === 1 ? (
							<Crown className="w-5 h-5 text-amber-400" />
						) : userRanking.percentile >= 75 ? (
							<Medal className="w-5 h-5 text-jellyfin" />
						) : (
							<Star className="w-5 h-5 text-jellyfin" />
						)}
						<span className="text-lg font-semibold text-white">
							{getPercentileMessage()}
						</span>
					</div>

					{/* Progress bar showing position relative to max */}
					<div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
						<motion.div
							initial={{ width: 0 }}
							animate={{
								width: `${userComparison.maxTotalHours > 0 ? Math.min((stats.totalHours / userComparison.maxTotalHours) * 100, 100) : 0}%`,
							}}
							transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
							className="absolute inset-y-0 left-0 gradient-jellyfin rounded-full"
						/>
					</div>
					<p className="text-sm text-muted-foreground mt-2">
						Top viewer watched {userRanking.topViewerHours.toLocaleString()}{" "}
						hours
					</p>
				</motion.div>
			)}

			{/* Content breakdown - unique movies and episodes */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.8 }}
				className="grid grid-cols-2 gap-4"
			>
				<div className="glass rounded-xl p-4">
					<div className="flex items-center justify-center gap-2 text-jellyfin mb-2">
						<Film className="w-5 h-5" />
					</div>
					<p className="text-2xl font-bold text-white">
						{stats.uniqueMovies.toLocaleString()}
					</p>
					<p className="text-sm text-muted-foreground">Unique Movies</p>
				</div>
				<div className="glass rounded-xl p-4">
					<div className="flex items-center justify-center gap-2 text-purple-400 mb-2">
						<Tv className="w-5 h-5" />
					</div>
					<p className="text-2xl font-bold text-white">
						{stats.uniqueEpisodes.toLocaleString()}
					</p>
					<p className="text-sm text-muted-foreground">Unique Episodes</p>
				</div>
			</motion.div>
		</div>
	);
}
