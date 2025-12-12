"use client";

import { motion } from "framer-motion";
import { Calendar, Clock, Film, Timer, Trophy, Tv } from "lucide-react";
import { formatTime } from "@/lib/helpers";
import type { Marathon } from "@/lib/types";
import { AnimatedNumber } from "../AnimatedNumber";

interface MarathonSlideProps {
	marathon: Marathon;
	timezone?: string;
}

export function MarathonSlide({ marathon, timezone }: MarathonSlideProps) {
	// Merge duplicate items by name
	const mergedItems = marathon.items.reduce(
		(acc, item) => {
			const existing = acc.find((i) => i.itemName === item.itemName);
			if (existing) {
				existing.durationMinutes += item.durationMinutes;
				existing.count = (existing.count || 1) + 1;
			} else {
				acc.push({ ...item, count: 1 });
			}
			return acc;
		},
		[] as Array<(typeof marathon.items)[0] & { count: number }>,
	);

	// Calculate actual watch time vs total marathon duration
	const actualWatchMinutes = marathon.items.reduce(
		(sum, item) => sum + item.durationMinutes,
		0,
	);
	const breakMinutes = marathon.totalMinutes - actualWatchMinutes;
	const hasSignificantBreak = breakMinutes >= 5;

	// Group items by type for display
	const movies = mergedItems.filter((item) => item.itemType === "Movie");
	const episodes = mergedItems.filter((item) => item.itemType === "Episode");

	// Get unique show names from episodes
	const showNames = new Set<string>();
	for (const ep of episodes) {
		const match = ep.itemName.match(/^(.+?)\s*-\s*s\d+e\d+/i);
		if (match) {
			showNames.add(match[1].trim());
		}
	}

	const startTime = formatTime(marathon.startTime, timezone);
	const endTime = formatTime(marathon.endTime, timezone);

	return (
		<div className="text-center max-w-3xl mx-auto">
			<motion.div
				initial={{ opacity: 0, scale: 0 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ type: "spring", stiffness: 200 }}
				className="mb-4"
			>
				<div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 rounded-full">
					<Trophy className="w-5 h-5 text-amber-500" />
					<span className="text-amber-500 font-semibold">
						Longest Watch Marathon
					</span>
				</div>
			</motion.div>

			<motion.p
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.1 }}
				className="text-lg text-muted-foreground mb-4"
			>
				Your most epic viewing session lasted
			</motion.p>

			<motion.div
				initial={{ scale: 0.5, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
				className="mb-4"
			>
				<div className="flex items-baseline justify-center gap-2">
					<AnimatedNumber
						value={marathon.totalHours}
						decimals={1}
						className="text-7xl md:text-8xl font-bold text-gradient"
					/>
					<span className="text-3xl text-white font-medium">hours</span>
				</div>
			</motion.div>

			{/* Fun fact */}
			<motion.div
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ delay: 0.4 }}
				className="mb-6"
			>
				<p className="text-lg text-amber-400/90 font-medium">
					{marathon.totalHours >= 16
						? "That's absolutely legendary! 🏆"
						: marathon.totalHours >= 12
							? "That's a true marathon! You deserve a medal! 🏅"
							: marathon.totalHours >= 8
								? "More than a full workday of entertainment! 🎬"
								: marathon.totalHours >= 6
									? "Now that's what we call commitment! 💪"
									: marathon.totalHours >= 4
										? "A proper movie night session! 🍿"
										: "Quality binge time! 📺"}
				</p>
			</motion.div>

			{/* Date and time info */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.4 }}
				className="glass rounded-2xl p-5 mb-6"
			>
				<div className="flex items-center justify-center gap-2 text-jellyfin mb-3">
					<Calendar className="w-5 h-5" />
					<span className="font-medium">{marathon.date}</span>
				</div>
				<div className="flex items-center justify-center gap-4 text-muted-foreground">
					<div className="flex items-center gap-1">
						<Clock className="w-4 h-4" />
						<span>{startTime}</span>
					</div>
					<span className="text-white/30">→</span>
					<div className="flex items-center gap-1">
						<Clock className="w-4 h-4" />
						<span>{endTime}</span>
					</div>
				</div>
			</motion.div>

			{/* Bathroom break comment */}
			{hasSignificantBreak && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.6 }}
					className="glass rounded-xl p-4 mb-6 bg-blue-500/10 border border-blue-500/20"
				>
					<p className="text-blue-300 text-sm">
						{breakMinutes >= 60 ? (
							<>
								You also took{" "}
								<span className="font-semibold">
									{Math.floor(breakMinutes / 60)}h {breakMinutes % 60}m
								</span>{" "}
								worth of breaks.{" "}
								{breakMinutes >= 120
									? "Did you fall asleep? 😴"
									: breakMinutes >= 60
										? "That's a long bathroom break! 🚽"
										: "Gotta stretch those legs! 🦵"}
							</>
						) : (
							<>
								Between episodes, you took about{" "}
								<span className="font-semibold">
									{Math.round(breakMinutes)}m
								</span>{" "}
								of bathroom breaks. 🚽
							</>
						)}
					</p>
				</motion.div>
			)}

			{/* What you watched */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.7 }}
				className="glass rounded-2xl p-5"
			>
				<h3 className="text-white font-semibold mb-4 flex items-center justify-center gap-2">
					<Timer className="w-5 h-5 text-jellyfin" />
					What You Watched
				</h3>

				<div className="grid grid-cols-2 gap-4 mb-4">
					{movies.length > 0 && (
						<div className="bg-white/5 rounded-xl p-4">
							<div className="flex items-center justify-center gap-2 text-jellyfin mb-2">
								<Film className="w-4 h-4" />
								<span className="font-medium">Movies</span>
							</div>
							<p className="text-2xl font-bold text-white">{movies.length}</p>
						</div>
					)}
					{episodes.length > 0 && (
						<div className="bg-white/5 rounded-xl p-4">
							<div className="flex items-center justify-center gap-2 text-jellyfin mb-2">
								<Tv className="w-4 h-4" />
								<span className="font-medium">Episodes</span>
							</div>
							<p className="text-2xl font-bold text-white">{episodes.length}</p>
						</div>
					)}
				</div>

				{/* Content list */}
				<div className="max-h-40 overflow-y-auto space-y-2 text-left">
					{mergedItems.slice(0, 10).map((item, index) => (
						<motion.div
							key={`${item.itemId}-${index}`}
							initial={{ opacity: 0, x: -10 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.9 + index * 0.05 }}
							className="flex items-center gap-3 text-sm"
						>
							<span className="text-jellyfin/60 font-mono text-xs w-6">
								{(index + 1).toString().padStart(2, "0")}
							</span>
							{item.itemType === "Movie" ? (
								<Film className="w-3 h-3 text-muted-foreground flex-shrink-0" />
							) : (
								<Tv className="w-3 h-3 text-muted-foreground flex-shrink-0" />
							)}
							<span className="text-white/80 truncate flex-1">
								{item.itemName}
								{item.count > 1 && (
									<span className="text-jellyfin/70 ml-1">×{item.count}</span>
								)}
							</span>
							<span className="text-muted-foreground text-xs">
								{item.durationMinutes}m
							</span>
						</motion.div>
					))}
					{mergedItems.length > 10 && (
						<p className="text-muted-foreground text-sm text-center pt-2">
							...and {mergedItems.length - 10} more
						</p>
					)}
				</div>
			</motion.div>
		</div>
	);
}
