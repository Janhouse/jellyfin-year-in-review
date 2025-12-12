"use client";

import { motion } from "framer-motion";
import {
	ArrowLeft,
	Clock,
	Database,
	Film,
	Play,
	Server,
	Tv,
	Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
	ServerStats,
	ServerTopMovie,
	ServerTopShow,
} from "@/lib/services";
import { YearSelector } from "./YearSelector";

interface ServerStatsViewProps {
	year: number;
	availableYears: number[];
	stats: ServerStats;
	topMovies: (ServerTopMovie & { posterUrl: string })[];
	topShows: (ServerTopShow & { posterUrl: string })[];
}

function TopItemCard({
	rank,
	name,
	posterUrl,
	hours,
	viewers,
	plays,
	delay,
	type: _type,
}: {
	rank: number;
	name: string;
	posterUrl: string;
	hours: number;
	viewers: number;
	plays: number;
	delay: number;
	type: "movie" | "show";
}) {
	const rankColors: Record<number, string> = {
		1: "text-yellow-500",
		2: "text-gray-300",
		3: "text-amber-600",
	};

	return (
		<motion.div
			initial={{ opacity: 0, x: -20 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ delay }}
			className="flex items-center gap-4 glass rounded-xl p-3"
		>
			<div
				className={`text-2xl font-bold ${rankColors[rank] || "text-white/50"} w-8`}
			>
				#{rank}
			</div>
			<div className="relative w-12 h-18 rounded-lg overflow-hidden flex-shrink-0">
				<Image src={posterUrl} alt={name} fill className="object-cover" />
			</div>
			<div className="flex-1 min-w-0">
				<p className="text-white font-medium truncate">{name}</p>
				<div className="flex items-center gap-3 text-sm text-muted-foreground">
					<span className="flex items-center gap-1">
						<Clock className="w-3 h-3" />
						{hours}h
					</span>
					<span className="flex items-center gap-1">
						<Users className="w-3 h-3" />
						{viewers}
					</span>
					<span className="flex items-center gap-1">
						<Play className="w-3 h-3" />
						{plays}
					</span>
				</div>
			</div>
		</motion.div>
	);
}

export function ServerStatsView({
	year,
	availableYears,
	stats,
	topMovies,
	topShows,
}: ServerStatsViewProps) {
	const router = useRouter();

	return (
		<div className="min-h-screen gradient-mesh">
			<div className="container mx-auto px-4 py-8 max-w-4xl">
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					className="flex items-center justify-between mb-8"
				>
					<Link
						href="/"
						className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors"
					>
						<ArrowLeft className="w-5 h-5" />
						Back to Home
					</Link>

					<YearSelector
						currentYear={year}
						availableYears={availableYears}
						onYearChange={(newYear) => router.push(`/stats?year=${newYear}`)}
					/>
				</motion.div>

				{/* Title */}
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
					className="text-center mb-8"
				>
					<div className="inline-flex items-center gap-2 px-4 py-2 bg-jellyfin/20 rounded-full mb-4">
						<Server className="w-4 h-4 text-jellyfin" />
						<span className="text-jellyfin font-medium">Server Statistics</span>
					</div>
					<h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
						{year} Server Recap
					</h1>
					<p className="text-muted-foreground">
						What everyone watched on this server
					</p>
				</motion.div>

				{/* 10TB Statement for 2025 */}
				{year === 2025 && (
					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ delay: 0.15 }}
						className="glass rounded-2xl p-6 mb-8 text-center bg-gradient-to-r from-jellyfin/20 to-purple-500/20 border border-jellyfin/30"
					>
						<div className="flex items-center justify-center gap-3 mb-3">
							<Database className="w-8 h-8 text-jellyfin" />
							<span className="text-5xl font-bold text-gradient">10+ TB</span>
						</div>
						<p className="text-lg text-white/90">
							of media content was served in 2025
						</p>
						<p className="text-sm text-muted-foreground mt-2">
							That's a lot of movies and TV shows!
						</p>
					</motion.div>
				)}

				{/* Stats Overview */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
					className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
				>
					<div className="glass rounded-xl p-4 text-center">
						<Clock className="w-6 h-6 text-jellyfin mx-auto mb-2" />
						<p className="text-2xl font-bold text-white">
							{Math.round(stats.totalHours).toLocaleString()}
						</p>
						<p className="text-xs text-muted-foreground">Total Hours</p>
					</div>
					<div className="glass rounded-xl p-4 text-center">
						<Play className="w-6 h-6 text-purple-400 mx-auto mb-2" />
						<p className="text-2xl font-bold text-white">
							{stats.totalPlays.toLocaleString()}
						</p>
						<p className="text-xs text-muted-foreground">Total Plays</p>
					</div>
					<div className="glass rounded-xl p-4 text-center">
						<Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
						<p className="text-2xl font-bold text-white">{stats.uniqueUsers}</p>
						<p className="text-xs text-muted-foreground">Active Users</p>
					</div>
					<div className="glass rounded-xl p-4 text-center">
						<Film className="w-6 h-6 text-green-400 mx-auto mb-2" />
						<p className="text-2xl font-bold text-white">
							{stats.uniqueMovies + stats.uniqueEpisodes}
						</p>
						<p className="text-xs text-muted-foreground">Unique Items</p>
					</div>
				</motion.div>

				{/* Top Content */}
				<div className="grid md:grid-cols-2 gap-6">
					{/* Top Movies */}
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: 0.3 }}
					>
						<div className="flex items-center gap-2 mb-4">
							<Film className="w-5 h-5 text-jellyfin" />
							<h2 className="text-xl font-semibold text-white">
								Most Watched Movies
							</h2>
						</div>
						<div className="space-y-3">
							{topMovies.map((movie, index) => (
								<TopItemCard
									key={movie.itemId}
									rank={index + 1}
									name={movie.itemName}
									posterUrl={movie.posterUrl}
									hours={movie.totalHours}
									viewers={movie.uniqueViewers}
									plays={movie.totalPlays}
									delay={0.4 + index * 0.1}
									type="movie"
								/>
							))}
							{topMovies.length === 0 && (
								<p className="text-muted-foreground text-center py-4">
									No movies watched yet
								</p>
							)}
						</div>
					</motion.div>

					{/* Top Shows */}
					<motion.div
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: 0.35 }}
					>
						<div className="flex items-center gap-2 mb-4">
							<Tv className="w-5 h-5 text-purple-400" />
							<h2 className="text-xl font-semibold text-white">
								Most Watched Shows
							</h2>
						</div>
						<div className="space-y-3">
							{topShows.map((show, index) => (
								<TopItemCard
									key={show.seriesName}
									rank={index + 1}
									name={show.seriesName}
									posterUrl={show.posterUrl}
									hours={show.totalHours}
									viewers={show.uniqueViewers}
									plays={show.totalEpisodes}
									delay={0.45 + index * 0.1}
									type="show"
								/>
							))}
							{topShows.length === 0 && (
								<p className="text-muted-foreground text-center py-4">
									No shows watched yet
								</p>
							)}
						</div>
					</motion.div>
				</div>

				{/* Back button */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.9 }}
					className="mt-8 text-center"
				>
					<Link
						href="/"
						className="inline-flex items-center gap-2 px-6 py-3 gradient-jellyfin text-white font-medium rounded-xl hover:opacity-90 transition-all"
					>
						<ArrowLeft className="w-4 h-4" />
						Back to Home
					</Link>
				</motion.div>
			</div>
		</div>
	);
}
