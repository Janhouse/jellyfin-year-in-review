"use client";

import { motion } from "framer-motion";
import { Clock, Film, Server, Sparkles, Trophy, Tv } from "lucide-react";
import Image from "next/image";
import type { PlaybackMethodStats, PlaybackStats } from "@/lib/data/playback";
import { streamerBlur } from "@/lib/hooks/useStreamerMode";
import type { UserComparison } from "@/lib/services";
import { Confetti, type ConfettiType } from "../Confetti";

interface Achievement {
	title: string;
	rank: number;
	icon: React.ReactNode;
	confettiEmojis: string[];
}

// Custom confetti component for achievements
function AchievementConfetti({ emojis }: { emojis: string[] }) {
	return <Confetti type="happy" intervalMs={6000} customEmojis={emojis} />;
}

interface SummarySlideProps {
	userName: string;
	year: number;
	stats: PlaybackStats;
	topMovie: {
		itemName: string;
		posterUrl: string;
		itemUrl: string | null;
	} | null;
	topShow: {
		itemName: string;
		posterUrl: string;
		itemUrl: string | null;
	} | null;
	topGenre: string | null;
	onGenreClick?: () => void;
	personality: string;
	playbackMethodStats: PlaybackMethodStats;
	userComparison: UserComparison;
	isStreamerMode?: boolean;
}

// Genre to adjective mapping for personalized titles
const genreAdjectives: Record<string, string> = {
	Action: "Action Hero",
	Adventure: "Adventurous",
	Animation: "Animated",
	Comedy: "Hilarious",
	Crime: "Detective",
	Documentary: "Curious",
	Drama: "Dramatic",
	Family: "Family-Loving",
	Fantasy: "Fantastical",
	History: "Historical",
	Horror: "Fearless",
	Music: "Melodic",
	Mystery: "Mysterious",
	Romance: "Romantic",
	"Science Fiction": "Futuristic",
	"Sci-Fi & Fantasy": "Sci-Fi",
	Thriller: "Thrilling",
	War: "Strategic",
	Western: "Wild West",
	"Action & Adventure": "Adventurous",
	Kids: "Playful",
	News: "Informed",
	Reality: "Reality-Loving",
	Soap: "Dramatic",
	Talk: "Talkative",
	"War & Politics": "Political",
};

export function SummarySlide({
	userName,
	year,
	stats,
	topMovie,
	topShow,
	topGenre,
	onGenreClick,
	personality,
	playbackMethodStats,
	userComparison,
	isStreamerMode,
}: SummarySlideProps) {
	// Get genre adjective for personalized title
	const genreAdjective = topGenre ? genreAdjectives[topGenre] : null;
	// Find best achievement (lowest rank that's in top 5)
	const achievements: Achievement[] = [
		{
			title: "Watch Time Champion",
			rank: userComparison.totalHoursRank,
			icon: <Clock className="w-5 h-5" />,
			confettiEmojis: ["⏰", "🕐", "⌚", "🎬", "📺", "🍿"],
		},
		{
			title: "Movie Marathon Master",
			rank: userComparison.movieHoursRank,
			icon: <Film className="w-5 h-5" />,
			confettiEmojis: ["🎬", "🎥", "🍿", "🎞️", "📽️", "🌟"],
		},
		{
			title: "Movie Explorer",
			rank: userComparison.uniqueMoviesRank,
			icon: <Film className="w-5 h-5" />,
			confettiEmojis: ["🎬", "🔍", "🗺️", "🎥", "✨", "🌟"],
		},
		{
			title: "Series Binger",
			rank: userComparison.showHoursRank,
			icon: <Tv className="w-5 h-5" />,
			confettiEmojis: ["📺", "🛋️", "🍿", "📡", "🎭", "⭐"],
		},
		{
			title: "Show Discoverer",
			rank: userComparison.uniqueShowsRank,
			icon: <Tv className="w-5 h-5" />,
			confettiEmojis: ["📺", "🔭", "🌟", "🗺️", "✨", "🎭"],
		},
		{
			title: "Server's Best Friend",
			rank: userComparison.serverFriendlinessRank,
			icon: <Server className="w-5 h-5" />,
			confettiEmojis: ["💚", "🖥️", "⚡", "🌿", "💾", "✨"],
		},
	];

	// Get best achievement that's in top 5 (excluding transcode - handled separately)
	const topAchievements = achievements
		.filter((a) => a.rank <= 5)
		.sort((a, b) => a.rank - b.rank);
	const bestAchievement = topAchievements[0] || null;

	// Check if user is top 5 in transcoding (special "achievement")
	const isTopTranscoder = userComparison.transcodeRank <= 5;
	const transcodeRank = userComparison.transcodeRank;

	// Determine confetti type based on playback method (same logic as TechStatsSlide)
	const directIsDominant =
		playbackMethodStats.directPercentage >=
			playbackMethodStats.remuxPercentage &&
		playbackMethodStats.directPercentage >=
			playbackMethodStats.transcodePercentage;
	const remuxIsDominant =
		playbackMethodStats.remuxPercentage >
			playbackMethodStats.directPercentage &&
		playbackMethodStats.remuxPercentage >=
			playbackMethodStats.transcodePercentage;
	const transcodeIsHigh = playbackMethodStats.transcodePercentage > 20;

	let confettiType: ConfettiType = "none";
	if (transcodeIsHigh) {
		confettiType = "stressed";
	} else if (directIsDominant) {
		confettiType = "happy";
	} else if (remuxIsDominant) {
		confettiType = "thumbsup";
	}

	return (
		<div className="w-full max-w-2xl mx-auto relative">
			{/* Confetti effect - use achievement confetti if available, otherwise playback-based */}
			{bestAchievement ? (
				<AchievementConfetti emojis={bestAchievement.confettiEmojis} />
			) : (
				<Confetti type={confettiType} intervalMs={8000} />
			)}

			{/* Additional heat confetti for power users */}
			{isTopTranscoder && (
				<Confetti
					type="stressed"
					intervalMs={10000}
					customEmojis={["🔥", "🥵", "💨", "♨️", "🌡️", "💻"]}
				/>
			)}

			<motion.div
				initial={{ scale: 0.9, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={{ type: "spring" }}
				className="glass rounded-3xl p-8 relative overflow-hidden"
			>
				{/* Header */}
				<div className="text-center mb-6">
					<motion.div
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						transition={{ delay: 0.2, type: "spring" }}
						className="inline-flex items-center gap-2 px-4 py-2 bg-jellyfin/20 rounded-full mb-4"
					>
						<Sparkles className="w-4 h-4 text-jellyfin" />
						<span className="text-jellyfin font-medium">{personality}</span>
					</motion.div>

					<h2 className="text-3xl font-bold text-white mb-2">
						{genreAdjective ? (
							<>
								<button
									type="button"
									onClick={onGenreClick}
									className="text-gradient hover:opacity-80 transition-opacity cursor-pointer"
								>
									{genreAdjective}
								</button>{" "}
								<span className={isStreamerMode ? streamerBlur : ""}>
									{userName}
								</span>{" "}
								{year}
							</>
						) : (
							<>
								<span className={isStreamerMode ? streamerBlur : ""}>
									{userName}
								</span>{" "}
								{year}
							</>
						)}
					</h2>
					<p className="text-muted-foreground">Year in Review</p>
				</div>

				{/* Stats */}
				<div className="mb-6">
					<div className="bg-white/5 rounded-xl p-4 text-center">
						<p className="text-3xl font-bold text-gradient">
							{Math.round(stats.totalHours)}
						</p>
						<p className="text-sm text-muted-foreground">Hours watched</p>
					</div>
				</div>

				{/* Top content */}
				<div className="flex justify-center gap-8 mb-6">
					{topMovie && (
						<div className="text-center">
							{topMovie.itemUrl ? (
								<a
									href={topMovie.itemUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="block relative w-32 h-48 rounded-xl overflow-hidden shadow-xl mb-3 transition-transform hover:scale-105"
								>
									<Image
										src={topMovie.posterUrl}
										alt={topMovie.itemName}
										fill
										className="object-cover"
									/>
								</a>
							) : (
								<div className="relative w-32 h-48 rounded-xl overflow-hidden shadow-xl mb-3">
									<Image
										src={topMovie.posterUrl}
										alt={topMovie.itemName}
										fill
										className="object-cover"
									/>
								</div>
							)}
							<p className="text-sm font-medium text-muted-foreground">
								#1 Movie
							</p>
						</div>
					)}
					{topShow && (
						<div className="text-center">
							{topShow.itemUrl ? (
								<a
									href={topShow.itemUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="block relative w-32 h-48 rounded-xl overflow-hidden shadow-xl mb-3 transition-transform hover:scale-105"
								>
									<Image
										src={topShow.posterUrl}
										alt={topShow.itemName}
										fill
										className="object-cover"
									/>
								</a>
							) : (
								<div className="relative w-32 h-48 rounded-xl overflow-hidden shadow-xl mb-3">
									<Image
										src={topShow.posterUrl}
										alt={topShow.itemName}
										fill
										className="object-cover"
									/>
								</div>
							)}
							<p className="text-sm font-medium text-muted-foreground">
								#1 Show
							</p>
						</div>
					)}
				</div>

				{/* Breakdown */}
				<div className="flex justify-center gap-6 text-center mb-6">
					<div>
						<p className="text-xl font-semibold text-white">
							{stats.uniqueMovies}
						</p>
						<p className="text-xs text-muted-foreground">Unique Movies</p>
					</div>
					<div className="w-px bg-white/20" />
					<div>
						<p className="text-xl font-semibold text-white">
							{stats.uniqueEpisodes}
						</p>
						<p className="text-xs text-muted-foreground">Unique Episodes</p>
					</div>
				</div>

				{/* Best Achievement or Encouragement Message */}
				{bestAchievement ? (
					<motion.div
						initial={{ scale: 0, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						transition={{ delay: 0.4, type: "spring" }}
						className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 rounded-xl p-4 border border-yellow-500/30"
					>
						<div className="flex items-center justify-center gap-3">
							<div className="w-10 h-10 rounded-full bg-yellow-500/30 flex items-center justify-center text-yellow-400">
								<Trophy className="w-5 h-5" />
							</div>
							<div className="text-center">
								<div className="flex items-center gap-2 justify-center">
									<span className="text-yellow-400">
										{bestAchievement.icon}
									</span>
									<p className="text-lg font-bold text-white">
										{bestAchievement.title}
									</p>
								</div>
								<p className="text-sm text-yellow-400/80">
									#{bestAchievement.rank} on the server
									{bestAchievement.rank === 1 && " 🤯"}
								</p>
							</div>
						</div>
					</motion.div>
				) : (
					<motion.div
						initial={{ scale: 0, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						transition={{ delay: 0.4, type: "spring" }}
						className="bg-gradient-to-r from-jellyfin/20 to-purple-500/20 rounded-xl p-4 border border-jellyfin/30"
					>
						<div className="text-center">
							<p className="text-lg font-medium text-white mb-1">
								Thanks for watching with us! 🎬
							</p>
							<p className="text-sm text-muted-foreground">
								Every hour of entertainment counts. Here's to more great content
								in {year + 1}!
							</p>
						</div>
					</motion.div>
				)}

				{/* Top Transcoder "Achievement" - shown in addition to best achievement */}
				{isTopTranscoder && (
					<motion.div
						initial={{ scale: 0, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						transition={{ delay: 0.6, type: "spring" }}
						className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl p-4 border border-orange-500/30 mt-4"
					>
						<div className="text-center">
							<div className="flex items-center gap-2 justify-center mb-1">
								<Server className="w-5 h-5 text-orange-400" />
								<p className="text-lg font-bold text-white">Power User</p>
								<span className="text-xs px-2 py-0.5 bg-orange-500/30 rounded-full text-orange-300">
									#{transcodeRank}
								</span>
							</div>
							<p className="text-sm text-orange-300/80">
								{transcodeRank === 1
									? "You're keeping the server warm this winter! 🔥"
									: transcodeRank <= 3
										? "The server fans spin a little faster when you watch 💨"
										: "You're doing your part to stress-test the GPU 😅"}
							</p>
						</div>
					</motion.div>
				)}
			</motion.div>
		</div>
	);
}
