"use client";

import { motion } from "framer-motion";
import { Clock, Play, Star } from "lucide-react";
import Image from "next/image";

interface TopMovieSlideProps {
	movie: {
		itemName: string;
		plays: number;
		totalMinutes: number;
		posterUrl: string;
		backdropUrl: string | null;
		rating: number | null;
		itemUrl: string | null;
	};
}

export function TopMovieSlide({ movie }: TopMovieSlideProps) {
	return (
		<div className="w-full max-w-4xl mx-auto">
			{/* Background */}
			{movie.backdropUrl && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 0.3 }}
					className="absolute inset-0 z-0"
				>
					<Image
						src={movie.backdropUrl}
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
					{movie.itemUrl ? (
						<a
							href={movie.itemUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="block w-full h-full rounded-2xl overflow-hidden shadow-2xl shadow-jellyfin/20 transition-transform hover:scale-105"
						>
							<Image
								src={movie.posterUrl}
								alt={movie.itemName}
								fill
								className="object-cover"
								priority
							/>
						</a>
					) : (
						<div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl shadow-jellyfin/20">
							<Image
								src={movie.posterUrl}
								alt={movie.itemName}
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
						className="text-jellyfin font-medium mb-2"
					>
						Your #1 Movie
					</motion.p>

					<motion.h2
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1 }}
						className="text-4xl md:text-5xl font-bold text-white mb-6"
					>
						{movie.itemName}
					</motion.h2>

					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2 }}
						className="flex flex-wrap items-center justify-center md:justify-start gap-4"
					>
						{movie.rating && (
							<div className="flex items-center gap-1 px-3 py-1 bg-yellow-500/20 rounded-full">
								<Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
								<span className="text-yellow-500 font-medium">
									{movie.rating.toFixed(1)}
								</span>
							</div>
						)}

						<div className="flex items-center gap-1 px-3 py-1 bg-jellyfin/20 rounded-full">
							<Play className="w-4 h-4 text-jellyfin" />
							<span className="text-jellyfin font-medium">
								{movie.plays} plays
							</span>
						</div>

						<div className="flex items-center gap-1 px-3 py-1 bg-white/10 rounded-full">
							<Clock className="w-4 h-4 text-white" />
							<span className="text-white font-medium">
								{movie.totalMinutes >= 60
									? `${Math.floor(movie.totalMinutes / 60)}h ${movie.totalMinutes % 60}m watched`
									: `${movie.totalMinutes}m watched`}
							</span>
						</div>
					</motion.div>

					<motion.p
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.4 }}
						className="mt-6 text-muted-foreground text-lg"
					>
						You really love this one!
					</motion.p>
				</div>
			</div>
		</div>
	);
}
