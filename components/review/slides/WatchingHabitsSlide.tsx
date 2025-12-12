"use client";

import { motion } from "framer-motion";
import type { DayOfWeekStats, HourlyStats } from "@/lib/data/playback";
import {
	getPersonalityDescription,
	getPersonalityEmoji,
} from "@/lib/helpers/personality";
import type { Personality } from "@/lib/types";

interface WatchingHabitsSlideProps {
	hourlyStats: HourlyStats[];
	dayOfWeekStats: DayOfWeekStats[];
	personality: Personality;
}

export function WatchingHabitsSlide({
	hourlyStats,
	dayOfWeekStats,
	personality,
}: WatchingHabitsSlideProps) {
	const maxPlays = Math.max(...hourlyStats.map((h) => h.plays));
	const peakHour = hourlyStats.reduce(
		(max, h) => (h.plays > max.plays ? h : max),
		hourlyStats[0],
	);
	const peakDay = dayOfWeekStats.reduce(
		(max, d) => (d.plays > max.plays ? d : max),
		dayOfWeekStats[0],
	);
	const maxDayPlays = Math.max(...dayOfWeekStats.map((d) => d.plays));

	return (
		<div className="w-full max-w-4xl mx-auto">
			<motion.div
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				className="text-center mb-8"
			>
				<h2 className="text-3xl md:text-4xl font-bold text-white">
					Your Watching Habits
				</h2>
				<p className="text-muted-foreground mt-2">When do you like to watch?</p>
			</motion.div>

			{/* Personality badge */}
			<motion.div
				initial={{ scale: 0 }}
				animate={{ scale: 1 }}
				transition={{ delay: 0.2, type: "spring" }}
				className="flex flex-col items-center mb-8"
			>
				<div className="glass rounded-2xl px-8 py-4 text-center">
					<div className="flex items-center justify-center gap-3 mb-2">
						<span className="text-3xl">{getPersonalityEmoji(personality)}</span>
						<span className="text-2xl font-bold text-white">{personality}</span>
					</div>
					<p className="text-muted-foreground text-sm">
						{getPersonalityDescription(personality)}
					</p>
				</div>
			</motion.div>

			<div className="grid md:grid-cols-2 gap-6">
				{/* Hourly heatmap */}
				<motion.div
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ delay: 0.3 }}
					className="glass rounded-2xl p-6"
				>
					<h3 className="text-lg font-semibold text-white mb-4">
						By Hour of Day
					</h3>
					<div className="grid grid-cols-12 gap-1">
						{hourlyStats.map((stat, i) => {
							const intensity = maxPlays > 0 ? stat.plays / maxPlays : 0;
							return (
								<div key={stat.hour} className="flex flex-col items-center">
									<div
										className="w-full aspect-square rounded-sm transition-colors"
										style={{
											backgroundColor: `rgba(0, 164, 220, ${0.1 + intensity * 0.9})`,
										}}
										title={`${stat.hour}:00 - ${stat.plays} plays`}
									/>
									{i % 4 === 0 && (
										<span className="text-xs text-muted-foreground mt-1">
											{stat.hour}
										</span>
									)}
								</div>
							);
						})}
					</div>
					<p className="text-sm text-muted-foreground mt-4">
						Peak time:{" "}
						<span className="text-jellyfin font-medium">
							{peakHour.hour}:00
						</span>{" "}
						({peakHour.plays} plays)
					</p>
				</motion.div>

				{/* Day of week */}
				<motion.div
					initial={{ opacity: 0, x: 20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ delay: 0.4 }}
					className="glass rounded-2xl p-6"
				>
					<h3 className="text-lg font-semibold text-white mb-4">
						By Day of Week
					</h3>
					<div className="space-y-3">
						{dayOfWeekStats.map((stat) => {
							const width =
								maxDayPlays > 0 ? (stat.plays / maxDayPlays) * 100 : 0;
							return (
								<div key={stat.day} className="flex items-center gap-3">
									<span className="text-sm text-muted-foreground w-12">
										{stat.dayName.slice(0, 3)}
									</span>
									<div className="flex-1 h-6 bg-white/5 rounded-full overflow-hidden">
										<motion.div
											initial={{ width: 0 }}
											animate={{ width: `${width}%` }}
											transition={{
												delay: 0.5 + stat.day * 0.1,
												duration: 0.5,
											}}
											className="h-full gradient-jellyfin rounded-full"
										/>
									</div>
									<span className="text-sm text-white w-12 text-right">
										{stat.plays}
									</span>
								</div>
							);
						})}
					</div>
					<p className="text-sm text-muted-foreground mt-4">
						Favorite day:{" "}
						<span className="text-jellyfin font-medium">{peakDay.dayName}</span>
					</p>
				</motion.div>
			</div>
		</div>
	);
}
