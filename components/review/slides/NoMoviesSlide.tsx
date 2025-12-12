"use client";

import { motion } from "framer-motion";
import { Film, Sparkles } from "lucide-react";

export function NoMoviesSlide() {
	return (
		<div className="w-full max-w-2xl mx-auto text-center">
			<motion.div
				initial={{ scale: 0, rotate: -180 }}
				animate={{ scale: 1, rotate: 0 }}
				transition={{ type: "spring", stiffness: 200, damping: 15 }}
				className="mx-auto w-32 h-32 rounded-full bg-gradient-to-br from-jellyfin/30 to-purple-500/30 flex items-center justify-center mb-8"
			>
				<Film className="w-16 h-16 text-jellyfin" />
			</motion.div>

			<motion.h2
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.2 }}
				className="text-3xl md:text-4xl font-bold text-white mb-4"
			>
				No Movies Finished... Yet! 🎬
			</motion.h2>

			<motion.p
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.3 }}
				className="text-xl text-muted-foreground mb-6"
			>
				Looks like you didn't complete any movies this year.
			</motion.p>

			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.4 }}
				className="glass rounded-2xl p-6 inline-block"
			>
				<div className="flex items-center gap-3 text-left">
					<Sparkles className="w-8 h-8 text-yellow-500 flex-shrink-0" />
					<div>
						<p className="text-white font-medium text-lg">
							Maybe next year? 🍿
						</p>
						<p className="text-muted-foreground">
							Don't be shy - there's a whole library of movies waiting for you!
						</p>
					</div>
				</div>
			</motion.div>

			<motion.p
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.6 }}
				className="mt-8 text-muted-foreground/70 text-sm"
			>
				Tip: Sometimes the best movie nights start with just pressing play ▶️
			</motion.p>
		</div>
	);
}
