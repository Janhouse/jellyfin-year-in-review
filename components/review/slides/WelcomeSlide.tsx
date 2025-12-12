"use client";

import { motion } from "framer-motion";
import { streamerBlur } from "@/lib/hooks/useStreamerMode";

interface WelcomeSlideProps {
	userName: string;
	year: number;
	onNext: () => void;
	isStreamerMode?: boolean;
}

export function WelcomeSlide({
	userName,
	year,
	onNext,
	isStreamerMode,
}: WelcomeSlideProps) {
	return (
		<div className="text-center max-w-2xl mx-auto">
			<motion.div
				initial={{ scale: 0.5, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={{ duration: 0.5, type: "spring" }}
				className="mb-8"
			>
				<h1 className="text-6xl md:text-8xl font-bold text-gradient mb-4">
					{year}
				</h1>
				<h2 className="text-3xl md:text-4xl font-semibold text-white">
					Year in Review
				</h2>
			</motion.div>

			<motion.div
				initial={{ y: 20, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ delay: 0.3, duration: 0.5 }}
				className="space-y-4"
			>
				<p className="text-xl text-muted-foreground">
					Hey{" "}
					<span
						className={`text-jellyfin font-semibold ${isStreamerMode ? streamerBlur : ""}`}
					>
						{userName}
					</span>
					!
				</p>
				<p className="text-lg text-muted-foreground">
					Let's take a look at your streaming journey this year.
				</p>
			</motion.div>

			<motion.button
				initial={{ y: 20, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ delay: 0.6, duration: 0.5 }}
				onClick={onNext}
				className="mt-12 px-8 py-4 gradient-jellyfin text-white font-semibold rounded-full hover:opacity-90 transition-all transform hover:scale-105 active:scale-95"
			>
				Let's Go
			</motion.button>
		</div>
	);
}
