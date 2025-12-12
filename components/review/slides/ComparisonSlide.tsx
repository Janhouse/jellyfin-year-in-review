"use client";

import { motion } from "framer-motion";
import {
	BarChart3,
	Clock,
	Film,
	Server,
	Trophy,
	Tv,
	Users,
	Zap,
} from "lucide-react";
import type { UserComparison } from "@/lib/services";
import { CardConfetti } from "../CardConfetti";

interface ComparisonSlideProps {
	comparison: UserComparison;
}

function StatCard({
	title,
	icon: Icon,
	value,
	unit,
	rank,
	percentile: _percentile,
	average,
	max,
	delay = 0,
	color = "jellyfin",
	confettiDelay = 0,
}: {
	title: string;
	icon: React.ElementType;
	value: number | string;
	unit?: string;
	rank: number;
	percentile: number;
	average: number | string;
	max: number | string;
	delay?: number;
	color?: string;
	confettiDelay?: number;
}) {
	const colorClasses: Record<
		string,
		{ bg: string; text: string; bar: string }
	> = {
		jellyfin: {
			bg: "bg-jellyfin/20",
			text: "text-jellyfin",
			bar: "gradient-jellyfin",
		},
		purple: {
			bg: "bg-purple-500/20",
			text: "text-purple-400",
			bar: "bg-gradient-to-r from-purple-500 to-pink-500",
		},
		green: {
			bg: "bg-green-500/20",
			text: "text-green-400",
			bar: "bg-gradient-to-r from-green-500 to-emerald-500",
		},
		blue: {
			bg: "bg-blue-500/20",
			text: "text-blue-400",
			bar: "bg-gradient-to-r from-blue-500 to-cyan-500",
		},
		orange: {
			bg: "bg-orange-500/20",
			text: "text-orange-400",
			bar: "bg-gradient-to-r from-orange-500 to-yellow-500",
		},
	};

	const colors = colorClasses[color] || colorClasses.jellyfin;
	const isTopFive = rank <= 5;

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay }}
			className="glass rounded-2xl p-4 relative overflow-hidden"
		>
			{/* Confetti for top 5 */}
			<CardConfetti active={isTopFive} delay={confettiDelay} />

			<div className="flex items-center gap-2 mb-3 relative z-20">
				<div
					className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center`}
				>
					<Icon className={`w-4 h-4 ${colors.text}`} />
				</div>
				<h3 className="text-sm font-semibold text-white">{title}</h3>
			</div>

			<div className="space-y-3 relative z-20">
				{/* Your value */}
				<div className="text-center">
					<p className={`text-3xl font-bold ${colors.text}`}>
						{value}
						{unit && <span className="text-sm ml-1">{unit}</span>}
					</p>
				</div>

				{/* Rank badge - only show if top 5 */}
				{isTopFive && (
					<div className="flex justify-center">
						<div className="inline-flex items-center gap-1.5 px-2 py-1 bg-yellow-500/20 rounded-full">
							<Trophy className="w-3 h-3 text-yellow-500" />
							<span className="text-yellow-400 font-medium text-xs">
								#{rank}
							</span>
							{rank === 1 && <span className="text-xl">🤯</span>}
						</div>
					</div>
				)}

				{/* Comparison bar */}
				<div className="space-y-1">
					<div className="flex justify-between text-xs text-muted-foreground">
						<span>
							Avg: {average}
							{unit ? ` ${unit}` : ""}
						</span>
						<span>
							Max: {max}
							{unit ? ` ${unit}` : ""}
						</span>
					</div>
					<div className="h-2 bg-white/5 rounded-full overflow-hidden relative">
						{/* Average marker */}
						<div
							className="absolute top-0 bottom-0 w-0.5 bg-white/50 z-10"
							style={{
								left: `${Number(max) > 0 ? Math.min((Number(average) / Number(max)) * 100, 100) : 0}%`,
							}}
						/>
						{/* User's bar */}
						<motion.div
							initial={{ width: 0 }}
							animate={{
								width: `${Number(max) > 0 ? Math.min((Number(value) / Number(max)) * 100, 100) : Number(value) > 0 ? 100 : 0}%`,
							}}
							transition={{ delay: delay + 0.3, duration: 0.6 }}
							className={`h-full ${colors.bar} rounded-full`}
						/>
					</div>
				</div>
			</div>
		</motion.div>
	);
}

function PlaybackMethodComparison({
	comparison,
	confettiDelay = 0,
}: {
	comparison: UserComparison;
	confettiDelay?: number;
}) {
	const isTopFive = comparison.serverFriendlinessRank <= 5;

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.5 }}
			className="glass rounded-2xl p-5 relative overflow-hidden"
		>
			{/* Confetti for top 5 */}
			<CardConfetti active={isTopFive} delay={confettiDelay} />

			<div className="flex items-center justify-between mb-4 relative z-20">
				<div className="flex items-center gap-2">
					<div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
						<Server className="w-4 h-4 text-green-400" />
					</div>
					<h3 className="text-sm font-semibold text-white">
						Server Friendliness
					</h3>
				</div>
				{isTopFive && (
					<div className="inline-flex items-center gap-1.5 px-2 py-1 bg-yellow-500/20 rounded-full">
						<Trophy className="w-3 h-3 text-yellow-500" />
						<span className="text-yellow-400 font-medium text-xs">
							#{comparison.serverFriendlinessRank}
						</span>
						{comparison.serverFriendlinessRank === 1 && (
							<span className="text-xl">🤯</span>
						)}
					</div>
				)}
			</div>

			<div className="grid grid-cols-3 gap-3 relative z-20">
				{/* Direct Play */}
				<div className="text-center">
					<div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mb-1 mx-auto">
						<Zap className="w-5 h-5 text-green-500" />
					</div>
					<p className="text-xl font-bold text-green-500">
						{comparison.directPercentage}%
					</p>
					<p className="text-xs text-muted-foreground">Direct</p>
					<p className="text-xs text-white/40">
						avg: {comparison.avgDirectPercentage}%
					</p>
					{comparison.directRank <= 5 && (
						<div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 bg-yellow-500/20 rounded-full">
							<Trophy className="w-2.5 h-2.5 text-yellow-500" />
							<span className="text-yellow-400 font-medium text-[10px]">
								#{comparison.directRank}
							</span>
							{comparison.directRank === 1 && (
								<span className="text-xs">🤯</span>
							)}
						</div>
					)}
				</div>

				{/* Remux */}
				<div className="text-center">
					<div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mb-1 mx-auto">
						<BarChart3 className="w-5 h-5 text-blue-500" />
					</div>
					<p className="text-xl font-bold text-blue-500">
						{comparison.remuxPercentage}%
					</p>
					<p className="text-xs text-muted-foreground">Remux</p>
					<p className="text-xs text-white/40">
						avg: {comparison.avgRemuxPercentage}%
					</p>
					{comparison.remuxRank <= 5 && (
						<div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 bg-yellow-500/20 rounded-full">
							<Trophy className="w-2.5 h-2.5 text-yellow-500" />
							<span className="text-yellow-400 font-medium text-[10px]">
								#{comparison.remuxRank}
							</span>
							{comparison.remuxRank === 1 && (
								<span className="text-xs">🤯</span>
							)}
						</div>
					)}
				</div>

				{/* Transcode */}
				<div className="text-center">
					<div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center mb-1 mx-auto">
						<Server className="w-5 h-5 text-orange-500" />
					</div>
					<p className="text-xl font-bold text-orange-500">
						{comparison.transcodePercentage}%
					</p>
					<p className="text-xs text-muted-foreground">Transcode</p>
					<p className="text-xs text-white/40">
						avg: {comparison.avgTranscodePercentage}%
					</p>
					{comparison.transcodeRank <= 5 && (
						<div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 bg-yellow-500/20 rounded-full">
							<Trophy className="w-2.5 h-2.5 text-yellow-500" />
							<span className="text-yellow-400 font-medium text-[10px]">
								#{comparison.transcodeRank}
							</span>
							{comparison.transcodeRank === 1 && (
								<span className="text-xs">🤯</span>
							)}
						</div>
					)}
				</div>
			</div>
		</motion.div>
	);
}

export function ComparisonSlide({ comparison }: ComparisonSlideProps) {
	return (
		<div className="w-full max-w-4xl mx-auto">
			{/* Title */}
			<motion.div
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				className="text-center mb-6"
			>
				<div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-full mb-3">
					<Users className="w-4 h-4 text-purple-400" />
					<span className="text-purple-400 font-medium">
						Compared to Others
					</span>
				</div>
				<h2 className="text-2xl md:text-4xl font-bold text-white">
					How You Compare
				</h2>
				<p className="text-muted-foreground mt-2">
					Your stats ranked against everyone else
				</p>
			</motion.div>

			{/* Stats - Single Column */}
			<div className="flex flex-col gap-3 mb-4">
				{/* Total Watch Time */}
				<StatCard
					title="Watch Time"
					icon={Clock}
					value={comparison.totalHours}
					unit="hrs"
					rank={comparison.totalHoursRank}
					percentile={comparison.totalHoursPercentile}
					average={comparison.avgTotalHours}
					max={comparison.maxTotalHours}
					delay={0.1}
					color="jellyfin"
					confettiDelay={0}
				/>

				{/* Movie Hours */}
				<StatCard
					title="Movie Time"
					icon={Film}
					value={comparison.movieHours}
					unit="hrs"
					rank={comparison.movieHoursRank}
					percentile={comparison.movieHoursPercentile}
					average={comparison.avgMovieHours}
					max={comparison.maxMovieHours}
					delay={0.15}
					color="blue"
					confettiDelay={800}
				/>

				{/* Unique Movies */}
				<StatCard
					title="Unique Movies"
					icon={Film}
					value={comparison.uniqueMovies}
					rank={comparison.uniqueMoviesRank}
					percentile={comparison.uniqueMoviesPercentile}
					average={comparison.avgUniqueMovies}
					max={comparison.maxUniqueMovies}
					delay={0.2}
					color="purple"
					confettiDelay={1600}
				/>

				{/* Show Hours */}
				<StatCard
					title="Show Time"
					icon={Tv}
					value={comparison.showHours}
					unit="hrs"
					rank={comparison.showHoursRank}
					percentile={comparison.showHoursPercentile}
					average={comparison.avgShowHours}
					max={comparison.maxShowHours}
					delay={0.25}
					color="orange"
					confettiDelay={2400}
				/>

				{/* Unique Shows */}
				<StatCard
					title="Unique Shows"
					icon={Tv}
					value={comparison.uniqueShows}
					rank={comparison.uniqueShowsRank}
					percentile={comparison.uniqueShowsPercentile}
					average={comparison.avgUniqueShows}
					max={comparison.maxUniqueShows}
					delay={0.3}
					color="green"
					confettiDelay={3200}
				/>
			</div>

			{/* Playback Methods */}
			<PlaybackMethodComparison comparison={comparison} confettiDelay={4000} />
		</div>
	);
}
