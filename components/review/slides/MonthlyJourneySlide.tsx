"use client";

import { motion } from "framer-motion";
import { Calendar, TrendingUp } from "lucide-react";
import type { MonthlyStats } from "@/lib/data/playback";

interface MonthlyJourneySlideProps {
	monthlyStats: MonthlyStats[];
	year: number;
}

export function MonthlyJourneySlide({
	monthlyStats,
	year,
}: MonthlyJourneySlideProps) {
	const maxHours = Math.max(...monthlyStats.map((m) => m.hours));
	const peakMonth = monthlyStats.reduce(
		(max, m) => (m.hours > max.hours ? m : max),
		monthlyStats[0],
	);

	return (
		<div className="w-full max-w-4xl mx-auto">
			<motion.div
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				className="text-center mb-8"
			>
				<h2 className="text-3xl md:text-4xl font-bold text-white">
					Your {year} Journey
				</h2>
				<p className="text-muted-foreground mt-2">
					Month by month viewing activity
				</p>
			</motion.div>

			{/* Chart */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.2 }}
				className="glass rounded-2xl p-6 pt-10 mb-6"
			>
				<div className="flex items-end justify-between h-48 gap-2 relative">
					{monthlyStats.map((month, i) => {
						const height = maxHours > 0 ? (month.hours / maxHours) * 100 : 0;
						const isPeak = month.month === peakMonth.month;

						return (
							<motion.div
								key={month.month}
								initial={{ height: 0 }}
								animate={{ height: `${height}%` }}
								transition={{
									delay: 0.3 + i * 0.05,
									duration: 0.5,
									type: "spring",
								}}
								className={`flex-1 rounded-t-lg relative group cursor-pointer transition-all ${
									isPeak ? "gradient-jellyfin" : "bg-white/20 hover:bg-white/30"
								}`}
							>
								{/* Tooltip */}
								<div className="absolute -top-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 rounded-lg px-3 py-2 text-center whitespace-nowrap z-10">
									<p className="text-white font-medium">{month.monthName}</p>
									<p className="text-jellyfin text-sm">
										{month.hours.toFixed(1)}h
									</p>
									<p className="text-muted-foreground text-xs">
										{month.plays} plays
									</p>
								</div>

								{/* Peak indicator */}
								{isPeak && (
									<div className="absolute -top-8 left-1/2 -translate-x-1/2">
										<TrendingUp className="w-5 h-5 text-jellyfin" />
									</div>
								)}
							</motion.div>
						);
					})}
				</div>

				{/* Month labels */}
				<div className="flex justify-between mt-3">
					{monthlyStats.map((month) => (
						<span
							key={month.month}
							className="text-xs text-muted-foreground flex-1 text-center"
						>
							{month.monthName.slice(0, 3)}
						</span>
					))}
				</div>
			</motion.div>

			{/* Stats */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.5 }}
				className="grid grid-cols-2 gap-4"
			>
				<div className="glass rounded-xl p-4 text-center">
					<Calendar className="w-6 h-6 text-jellyfin mx-auto mb-2" />
					<p className="text-2xl font-bold text-white">{peakMonth.monthName}</p>
					<p className="text-sm text-muted-foreground">Peak month</p>
				</div>

				<div className="glass rounded-xl p-4 text-center">
					<TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-2" />
					<p className="text-2xl font-bold text-white">
						{peakMonth.hours.toFixed(1)}h
					</p>
					<p className="text-sm text-muted-foreground">
						Most watched in {peakMonth.monthName.slice(0, 3)}
					</p>
				</div>
			</motion.div>
		</div>
	);
}
