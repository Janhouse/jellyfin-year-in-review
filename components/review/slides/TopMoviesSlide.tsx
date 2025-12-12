"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import Image from "next/image";

interface TopMoviesSlideProps {
	movies: Array<{
		itemName: string;
		plays: number;
		totalMinutes: number;
		posterUrl: string;
		rating: number | null;
		itemUrl: string | null;
	}>;
}

export function TopMoviesSlide({ movies }: TopMoviesSlideProps) {
	return (
		<div className="w-full">
			<motion.div
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				className="text-center mb-6"
			>
				<h2 className="text-2xl md:text-4xl font-bold text-white">
					Your Top Movies
				</h2>
				<p className="text-muted-foreground text-sm md:text-base mt-1">
					The films that defined your year
				</p>
			</motion.div>

			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
				{movies.map((movie, index) => {
					const content = (
						<>
							{/* Rank badge */}
							<div className="absolute -top-3 -left-3 z-20 w-9 h-9 md:w-10 md:h-10 rounded-full gradient-jellyfin flex items-center justify-center text-white font-bold text-base md:text-lg shadow-xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
								{index + 1}
							</div>

							{/* Poster */}
							<div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-lg group-hover:shadow-jellyfin/30 transition-all duration-300 group-hover:scale-[1.02]">
								<Image
									src={movie.posterUrl}
									alt={movie.itemName}
									fill
									className="object-cover"
								/>

								{/* Overlay */}
								<div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-3">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<span className="text-jellyfin text-xs font-medium">
												{movie.plays}x
											</span>
											{movie.rating && (
												<div className="flex items-center gap-0.5">
													<Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
													<span className="text-yellow-500 text-xs">
														{movie.rating.toFixed(1)}
													</span>
												</div>
											)}
										</div>
										<span className="text-white/60 text-xs">
											{movie.totalMinutes >= 60
												? `${Math.floor(movie.totalMinutes / 60)}h ${movie.totalMinutes % 60}m`
												: `${movie.totalMinutes}m`}
										</span>
									</div>
								</div>
							</div>

							{/* Title */}
							<p className="mt-2 text-sm text-white font-medium line-clamp-2">
								{movie.itemName}
							</p>
						</>
					);

					return (
						<motion.div
							key={movie.itemName}
							initial={{ opacity: 0, y: 30, scale: 0.9 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							transition={{ delay: index * 0.08, type: "spring" }}
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
		</div>
	);
}
