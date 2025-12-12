"use client";

import { motion } from "framer-motion";
import { HardDrive, Server, Sparkles, Zap } from "lucide-react";
import { Confetti } from "../Confetti";

export function ServerMilestoneSlide() {
	return (
		<div className="w-full max-w-2xl mx-auto relative">
			{/* Celebration confetti */}
			<Confetti type="happy" intervalMs={6000} />

			{/* Main content */}
			<motion.div
				initial={{ scale: 0.9, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={{ type: "spring", stiffness: 200 }}
				className="glass rounded-3xl p-8 text-center"
			>
				{/* Badge */}
				<motion.div
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					transition={{ delay: 0.2, type: "spring" }}
					className="inline-flex items-center gap-2 px-4 py-2 bg-jellyfin/20 rounded-full mb-6"
				>
					<Sparkles className="w-4 h-4 text-jellyfin" />
					<span className="text-jellyfin font-medium">2025 Milestone</span>
				</motion.div>

				{/* Server icon */}
				<motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.3 }}
					className="flex justify-center mb-6"
				>
					<div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-jellyfin to-purple-600 flex items-center justify-center shadow-lg shadow-jellyfin/30">
						<Server className="w-12 h-12 text-white" />
					</div>
				</motion.div>

				{/* Main text */}
				<motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.4 }}
				>
					<h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
						Together We Streamed
					</h2>
					<div className="flex items-baseline justify-center gap-3 mb-4">
						<span className="text-6xl md:text-8xl font-bold text-gradient">
							10+
						</span>
						<span className="text-3xl md:text-4xl font-bold text-white">
							TB
						</span>
					</div>
					<p className="text-xl text-muted-foreground">of content this year!</p>
				</motion.div>

				{/* Fun facts */}
				<motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.6 }}
					className="mt-8 grid grid-cols-2 gap-4"
				>
					<div className="bg-white/5 rounded-xl p-4">
						<div className="flex items-center justify-center gap-2 text-blue-400 mb-2">
							<HardDrive className="w-5 h-5" />
						</div>
						<p className="text-lg font-semibold text-white">10,000+ GB</p>
						<p className="text-xs text-muted-foreground">Data transferred</p>
					</div>
					<div className="bg-white/5 rounded-xl p-4">
						<div className="flex items-center justify-center gap-2 text-green-400 mb-2">
							<Zap className="w-5 h-5" />
						</div>
						<p className="text-lg font-semibold text-white">24/7</p>
						<p className="text-xs text-muted-foreground">
							Striving for next year 😅
						</p>
					</div>
				</motion.div>

				{/* Thank you message */}
				<motion.p
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.8 }}
					className="mt-6 text-muted-foreground"
				>
					Thank you for being part of our streaming family! 💜
				</motion.p>
			</motion.div>
		</div>
	);
}
