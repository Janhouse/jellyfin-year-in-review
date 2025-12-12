"use client";

import { motion } from "framer-motion";
import { Clock, Film, Tv } from "lucide-react";

interface GenreStats {
	genre: string;
	movieMinutes: number;
	showMinutes: number;
	totalMinutes: number;
	movieCount: number;
	showCount: number;
}

interface TopGenresSlideProps {
	genres: GenreStats[];
}

// Genre emoji mapping for fun visual appeal
const genreEmojis: Record<string, string> = {
	Action: "💥",
	Adventure: "🗺️",
	Animation: "🎨",
	Comedy: "😂",
	Crime: "🔍",
	Documentary: "📹",
	Drama: "🎭",
	Family: "👨‍👩‍👧‍👦",
	Fantasy: "🧙",
	History: "📜",
	Horror: "👻",
	Music: "🎵",
	Mystery: "🕵️",
	Romance: "💕",
	"Science Fiction": "🚀",
	"Sci-Fi & Fantasy": "🚀",
	Thriller: "😱",
	War: "⚔️",
	Western: "🤠",
	"Action & Adventure": "💥",
	Kids: "🧒",
	News: "📰",
	Reality: "📺",
	Soap: "💧",
	Talk: "🎤",
	"War & Politics": "⚔️",
};

function getGenreEmoji(genre: string): string {
	return genreEmojis[genre] || "🎬";
}

function formatTime(minutes: number): string {
	if (minutes >= 60) {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
	}
	return `${minutes}m`;
}

export function TopGenresSlide({ genres }: TopGenresSlideProps) {
	if (genres.length === 0) {
		return (
			<div className="w-full max-w-2xl mx-auto text-center">
				<motion.h2
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					className="text-2xl md:text-4xl font-bold text-white mb-4"
				>
					No Genre Data Available
				</motion.h2>
				<p className="text-muted-foreground">
					We couldn't find genre information for your watched content.
				</p>
			</div>
		);
	}

	const topGenre = genres[0];
	const maxMinutes = topGenre.totalMinutes;

	return (
		<div className="w-full max-w-3xl mx-auto">
			<motion.div
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				className="text-center mb-6"
			>
				<h2 className="text-2xl md:text-4xl font-bold text-white">
					Your Favorite Genres
				</h2>
				<p className="text-muted-foreground text-sm md:text-base mt-1">
					What you loved watching this year
				</p>
			</motion.div>

			{/* Top genre highlight */}
			<motion.div
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ delay: 0.1 }}
				className="glass rounded-2xl p-6 mb-6 text-center"
			>
				<div className="text-5xl mb-3">{getGenreEmoji(topGenre.genre)}</div>
				<h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
					{topGenre.genre}
				</h3>
				<p className="text-jellyfin font-medium text-lg">
					Your #1 genre with {formatTime(topGenre.totalMinutes)} watched
				</p>
				<div className="flex items-center justify-center gap-4 mt-3 text-sm text-muted-foreground">
					{topGenre.movieCount > 0 && (
						<div className="flex items-center gap-1">
							<Film className="w-4 h-4" />
							<span>{topGenre.movieCount} movies</span>
						</div>
					)}
					{topGenre.showCount > 0 && (
						<div className="flex items-center gap-1">
							<Tv className="w-4 h-4" />
							<span>{topGenre.showCount} shows</span>
						</div>
					)}
				</div>
			</motion.div>

			{/* Genre bars */}
			<div className="space-y-3">
				{genres.slice(0, 8).map((genre, index) => (
					<motion.div
						key={genre.genre}
						initial={{ opacity: 0, x: -30 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: 0.15 + index * 0.05 }}
						className="glass rounded-xl p-3"
					>
						<div className="flex items-center gap-3">
							<span className="text-2xl w-10 text-center">
								{getGenreEmoji(genre.genre)}
							</span>
							<div className="flex-1 min-w-0">
								<div className="flex items-center justify-between mb-1">
									<span className="text-white font-medium truncate">
										{genre.genre}
									</span>
									<div className="flex items-center gap-1 text-muted-foreground text-sm">
										<Clock className="w-3 h-3" />
										<span>{formatTime(genre.totalMinutes)}</span>
									</div>
								</div>
								<div className="h-2 bg-white/10 rounded-full overflow-hidden">
									<motion.div
										initial={{ width: 0 }}
										animate={{
											width: `${(genre.totalMinutes / maxMinutes) * 100}%`,
										}}
										transition={{ delay: 0.3 + index * 0.05, duration: 0.5 }}
										className="h-full rounded-full"
										style={{
											background:
												genre.movieMinutes > genre.showMinutes
													? "linear-gradient(90deg, #00a4dc, #0085b3)"
													: "linear-gradient(90deg, #a855f7, #7c3aed)",
										}}
									/>
								</div>
								<div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
									{genre.movieMinutes > 0 && (
										<span className="flex items-center gap-1">
											<Film className="w-3 h-3 text-jellyfin" />
											{formatTime(genre.movieMinutes)}
										</span>
									)}
									{genre.showMinutes > 0 && (
										<span className="flex items-center gap-1">
											<Tv className="w-3 h-3 text-purple-400" />
											{formatTime(genre.showMinutes)}
										</span>
									)}
								</div>
							</div>
						</div>
					</motion.div>
				))}
			</div>

			{genres.length > 8 && (
				<motion.p
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.8 }}
					className="text-center text-muted-foreground/60 text-sm mt-4"
				>
					+{genres.length - 8} more genres explored
				</motion.p>
			)}
		</div>
	);
}
