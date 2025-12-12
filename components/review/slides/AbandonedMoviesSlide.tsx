"use client";

import { motion } from "framer-motion";
import { FastForward } from "lucide-react";
import Image from "next/image";

interface AbandonedMovie {
	itemName: string;
	completionPercent: number;
	posterUrl: string;
	itemUrl: string | null;
}

interface AbandonedMoviesSlideProps {
	movies: AbandonedMovie[];
}

export function AbandonedMoviesSlide({ movies }: AbandonedMoviesSlideProps) {
	// Fun messages based on how many movies were abandoned
	const getMessage = () => {
		if (movies.length >= 6) {
			return {
				title: "The Great Movie Sampler! 🎰",
				subtitle: "So many movies, so little commitment",
				message:
					"You tried a LOT of movies but couldn't quite settle on one. We get it - sometimes nothing feels right!",
			};
		}
		if (movies.length >= 4) {
			return {
				title: "Movie Window Shopping 🛒",
				subtitle: "Browsing, but not buying",
				message:
					"You started quite a few movies but moved on. Maybe next year you'll find 'the one'!",
			};
		}
		return {
			title: "Almost Made It! 🏃",
			subtitle: "So close, yet so far",
			message:
				"A few movies didn't quite make the cut. Hey, life happens - maybe give them another shot?",
		};
	};

	const { title, subtitle, message } = getMessage();

	return (
		<div className="w-full max-w-4xl mx-auto">
			<motion.div
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				className="text-center mb-6"
			>
				<h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
					{title}
				</h2>
				<p className="text-jellyfin font-medium">{subtitle}</p>
				<p className="text-muted-foreground text-sm md:text-base mt-2 max-w-lg mx-auto">
					{message}
				</p>
			</motion.div>

			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.2 }}
				className="glass rounded-2xl p-4 md:p-6"
			>
				<div className="flex items-center gap-2 mb-4 text-muted-foreground">
					<FastForward className="w-5 h-5" />
					<span className="text-sm font-medium">
						Movies you started but didn't finish
					</span>
				</div>

				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
					{movies.slice(0, 8).map((movie, index) => {
						const content = (
							<>
								{/* Poster */}
								<div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-lg group-hover:shadow-jellyfin/20 transition-all duration-300 group-hover:scale-[1.02]">
									<Image
										src={movie.posterUrl}
										alt={movie.itemName}
										fill
										className="object-cover opacity-70 group-hover:opacity-90 transition-opacity"
									/>

									{/* Progress overlay at bottom */}
									<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2">
										{/* Progress bar */}
										<div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden mb-1">
											<motion.div
												initial={{ width: 0 }}
												animate={{ width: `${movie.completionPercent}%` }}
												transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
												className="h-full bg-jellyfin rounded-full"
											/>
										</div>
										<span className="text-white/80 text-xs">
											{movie.completionPercent}% watched
										</span>
									</div>
								</div>

								{/* Title */}
								<p className="mt-2 text-xs text-white/80 font-medium line-clamp-2">
									{movie.itemName}
								</p>
							</>
						);

						return (
							<motion.div
								key={movie.itemName}
								initial={{ opacity: 0, y: 20, scale: 0.9 }}
								animate={{ opacity: 1, y: 0, scale: 1 }}
								transition={{ delay: 0.1 + index * 0.05, type: "spring" }}
								className="relative group"
							>
								{movie.itemUrl ? (
									<a
										href={movie.itemUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="block"
									>
										{content}
									</a>
								) : (
									content
								)}
							</motion.div>
						);
					})}
				</div>
			</motion.div>

			<motion.p
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.5 }}
				className="mt-6 text-center text-muted-foreground/70 text-sm"
			>
				💡 Pro tip: Sometimes movies get better after the slow start!
			</motion.p>
		</div>
	);
}
