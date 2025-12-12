"use client";

import { motion } from "framer-motion";
import { Clock, Sparkles, Star, Tv } from "lucide-react";
import Image from "next/image";

interface TopShowSlideProps {
	show: {
		itemName: string;
		plays: number;
		totalMinutes: number;
		posterUrl: string;
		backdropUrl: string | null;
		rating: number | null;
		itemUrl: string | null;
		seasonsCompleted?: number;
		totalSeasons?: number | null;
		avgEpisodesPerSeason?: number | null;
	};
}

export function TopShowSlide({ show }: TopShowSlideProps) {
	const episodesWatched = show.plays;

	// Use actual TMDB season data if available, otherwise estimate
	const hasSeasonData =
		show.avgEpisodesPerSeason !== null &&
		show.avgEpisodesPerSeason !== undefined;
	const seasonsCompleted = show.seasonsCompleted ?? 0;

	// Calculate estimated seasons based on actual episode count per season
	const estimatedSeasons =
		hasSeasonData && show.avgEpisodesPerSeason && show.avgEpisodesPerSeason > 0
			? Math.floor(episodesWatched / show.avgEpisodesPerSeason)
			: Math.floor(episodesWatched / 10); // Fallback to 10 eps/season

	const noSeasonCompleted = seasonsCompleted === 0;

	return (
		<div className="w-full max-w-4xl mx-auto">
			{/* Background */}
			{show.backdropUrl && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 0.3 }}
					className="absolute inset-0 z-0"
				>
					<Image
						src={show.backdropUrl}
						alt=""
						fill
						className="object-cover blur-sm"
						priority
					/>
					<div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/50" />
				</motion.div>
			)}

			<div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
				{/* Poster */}
				<motion.div
					initial={{ x: -50, opacity: 0 }}
					animate={{ x: 0, opacity: 1 }}
					transition={{ type: "spring", stiffness: 200 }}
					className="relative w-48 md:w-64 aspect-[2/3]"
				>
					{show.itemUrl ? (
						<a
							href={show.itemUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="block w-full h-full rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/20 transition-transform hover:scale-105"
						>
							<Image
								src={show.posterUrl}
								alt={show.itemName}
								fill
								className="object-cover"
								priority
							/>
						</a>
					) : (
						<div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/20">
							<Image
								src={show.posterUrl}
								alt={show.itemName}
								fill
								className="object-cover"
								priority
							/>
						</div>
					)}
				</motion.div>

				{/* Info */}
				<div className="flex-1 text-center md:text-left">
					<motion.p
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						className="text-purple-400 font-medium mb-2"
					>
						Your #1 Show
					</motion.p>

					<motion.h2
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1 }}
						className="text-4xl md:text-5xl font-bold text-white mb-6"
					>
						{show.itemName}
					</motion.h2>

					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2 }}
						className="flex flex-wrap items-center justify-center md:justify-start gap-4"
					>
						{show.rating && (
							<div className="flex items-center gap-1 px-3 py-1 bg-yellow-500/20 rounded-full">
								<Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
								<span className="text-yellow-500 font-medium">
									{show.rating.toFixed(1)}
								</span>
							</div>
						)}

						<div className="flex items-center gap-1 px-3 py-1 bg-purple-500/20 rounded-full">
							<Tv className="w-4 h-4 text-purple-400" />
							<span className="text-purple-400 font-medium">
								{episodesWatched} episodes
							</span>
						</div>

						<div className="flex items-center gap-1 px-3 py-1 bg-white/10 rounded-full">
							<Clock className="w-4 h-4 text-white" />
							<span className="text-white font-medium">
								{show.totalMinutes >= 60
									? `${Math.floor(show.totalMinutes / 60)}h ${show.totalMinutes % 60}m`
									: `${show.totalMinutes}m`}
							</span>
						</div>
					</motion.div>

					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.4 }}
						className="mt-6 glass rounded-xl p-4 inline-block"
					>
						{noSeasonCompleted ? (
							<div className="flex items-center gap-3">
								<Sparkles className="w-6 h-6 text-yellow-500 flex-shrink-0" />
								<div>
									<p className="text-white font-medium">Great start! 🌟</p>
									<p className="text-muted-foreground text-sm">
										You've begun your journey with this show. Maybe you'll
										finish a season next year?
									</p>
								</div>
							</div>
						) : seasonsCompleted > 0 && show.totalSeasons ? (
							seasonsCompleted >= show.totalSeasons ? (
								<p className="text-muted-foreground">
									You binged{" "}
									<span className="text-purple-400 font-semibold">
										the entire series
									</span>{" "}
									({show.totalSeasons}{" "}
									{show.totalSeasons === 1 ? "season" : "seasons"})! 🏆
								</p>
							) : (
								<p className="text-muted-foreground">
									You binged{" "}
									<span className="text-purple-400 font-semibold">
										{seasonsCompleted}{" "}
										{seasonsCompleted === 1 ? "season" : "seasons"}
									</span>{" "}
									— {show.totalSeasons - seasonsCompleted} more to go! 📺
								</p>
							)
						) : seasonsCompleted > 0 ? (
							<p className="text-muted-foreground">
								You binged through{" "}
								<span className="text-purple-400 font-semibold">
									{seasonsCompleted}{" "}
									{seasonsCompleted === 1 ? "season" : "seasons"}
								</span>
								! 🎬
							</p>
						) : estimatedSeasons > 0 ? (
							<p className="text-muted-foreground">
								You watched approximately{" "}
								<span className="text-purple-400 font-semibold">
									{estimatedSeasons}{" "}
									{estimatedSeasons === 1 ? "season" : "seasons"}
								</span>
								&apos; worth of episodes!
							</p>
						) : (
							<div className="flex items-center gap-3">
								<Sparkles className="w-6 h-6 text-yellow-500 flex-shrink-0" />
								<p className="text-muted-foreground">
									You've started exploring this show! Keep watching 📺
								</p>
							</div>
						)}
					</motion.div>
				</div>
			</div>
		</div>
	);
}
