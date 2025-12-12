"use client";

import { motion } from "framer-motion";
import { Star, Target, Tv } from "lucide-react";
import Image from "next/image";

interface TopShowsSlideProps {
	shows: Array<{
		itemName: string;
		plays: number;
		totalMinutes: number;
		posterUrl: string;
		rating: number | null;
		itemUrl: string | null;
	}>;
}

// Fun messages for users who watched fewer than 5 shows
function getFocusedViewerMessage(count: number) {
	if (count === 1) {
		return {
			title: "One Show to Rule Them All! 👑",
			subtitle: "Why fix what isn't broken?",
		};
	}
	if (count === 2) {
		return {
			title: "The Dynamic Duo! 🦸‍♂️🦸‍♀️",
			subtitle: "Two shows, zero regrets",
		};
	}
	if (count === 3) {
		return {
			title: "The Power Trio! ⚡",
			subtitle: "Three's company, four's a crowd",
		};
	}
	return {
		title: "Quality Over Quantity! 🎯",
		subtitle: "You know exactly what you like",
	};
}

export function TopShowsSlide({ shows }: TopShowsSlideProps) {
	const isFocusedViewer = shows.length < 5;
	const focusedMessage = isFocusedViewer
		? getFocusedViewerMessage(shows.length)
		: null;

	return (
		<div className="w-full">
			<motion.div
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				className="text-center mb-6"
			>
				<h2 className="text-2xl md:text-4xl font-bold text-white">
					{focusedMessage ? focusedMessage.title : "Your Top Shows"}
				</h2>
				<p className="text-muted-foreground text-sm md:text-base mt-1">
					{focusedMessage
						? focusedMessage.subtitle
						: "The series you couldn't stop watching"}
				</p>
			</motion.div>

			{/* Fun message for focused viewers */}
			{isFocusedViewer && (
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: 0.1 }}
					className="glass rounded-xl p-4 mb-6 max-w-md mx-auto"
				>
					<div className="flex items-center gap-3">
						<Target className="w-8 h-8 text-purple-400 flex-shrink-0" />
						<p className="text-white/80 text-sm">
							{shows.length === 1
								? "When you find perfection, why look elsewhere? 🎬"
								: `Only ${shows.length} shows? You're not indecisive, you're selective! 😎`}
						</p>
					</div>
				</motion.div>
			)}

			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
				{shows.map((show, index) => {
					const content = (
						<>
							{/* Rank badge */}
							<div className="absolute -top-3 -left-3 z-20 w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-base md:text-lg shadow-xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
								{index + 1}
							</div>

							{/* Poster */}
							<div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-lg group-hover:shadow-purple-500/30 transition-all duration-300 group-hover:scale-[1.02]">
								<Image
									src={show.posterUrl}
									alt={show.itemName}
									fill
									className="object-cover"
								/>

								{/* Overlay */}
								<div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-3">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<div className="flex items-center gap-1">
												<Tv className="w-3 h-3 text-purple-400" />
												<span className="text-purple-400 text-xs font-medium">
													{show.plays} eps
												</span>
											</div>
											{show.rating && (
												<div className="flex items-center gap-0.5">
													<Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
													<span className="text-yellow-500 text-xs">
														{show.rating.toFixed(1)}
													</span>
												</div>
											)}
										</div>
										<span className="text-white/60 text-xs">
											{show.totalMinutes >= 60
												? `${Math.floor(show.totalMinutes / 60)}h`
												: `${show.totalMinutes}m`}
										</span>
									</div>
								</div>
							</div>

							{/* Title */}
							<p className="mt-2 text-sm text-white font-medium line-clamp-2">
								{show.itemName}
							</p>
						</>
					);

					return (
						<motion.div
							key={show.itemName}
							initial={{ opacity: 0, y: 30, scale: 0.9 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							transition={{ delay: index * 0.08, type: "spring" }}
							className="relative group"
						>
							{show.itemUrl ? (
								<a
									href={show.itemUrl}
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
