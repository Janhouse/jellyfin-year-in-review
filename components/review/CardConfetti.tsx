"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

interface CardConfettiProps {
	active: boolean;
	delay?: number; // Random offset in ms to stagger between cards
}

const emojis = ["🏆", "⭐", "✨", "💫", "🌟"];

interface Particle {
	id: number;
	emoji: string;
	x: number;
	delay: number;
}

export function CardConfetti({ active, delay = 0 }: CardConfettiProps) {
	const [particles, setParticles] = useState<Particle[]>([]);

	useEffect(() => {
		if (!active) return;

		const fireConfetti = () => {
			const newParticles: Particle[] = Array.from({ length: 4 }, (_, i) => ({
				id: Date.now() + i + Math.random() * 1000,
				emoji: emojis[Math.floor(Math.random() * emojis.length)],
				x: 10 + Math.random() * 80, // Random x position (10-90%)
				delay: i * 0.15,
			}));
			setParticles((prev) => [...prev, ...newParticles]);

			// Clean up old particles after animation
			setTimeout(() => {
				setParticles((prev) => prev.filter((p) => !newParticles.includes(p)));
			}, 3000);
		};

		// Fire with initial random delay
		const initialTimeout = setTimeout(fireConfetti, delay);

		// Set up interval with staggered timing (5-8 seconds + random offset)
		const baseInterval = 5000 + Math.random() * 3000;
		const interval = setInterval(fireConfetti, baseInterval);

		return () => {
			clearTimeout(initialTimeout);
			clearInterval(interval);
		};
	}, [active, delay]);

	if (!active) return null;

	return (
		<div className="absolute inset-0 overflow-hidden pointer-events-none z-10 rounded-2xl">
			<AnimatePresence>
				{particles.map((particle) => (
					<motion.div
						key={particle.id}
						initial={{
							opacity: 0,
							y: "100%",
							scale: 0.3,
						}}
						animate={{
							opacity: [0, 1, 1, 0],
							y: ["100%", "40%", "10%", "-20%"],
							scale: [0.3, 1, 0.9, 0.7],
							rotate: [0, 15, -15, 0],
						}}
						exit={{ opacity: 0 }}
						transition={{
							duration: 2.5,
							delay: particle.delay,
							ease: "easeOut",
						}}
						className="absolute text-xl"
						style={{ left: `${particle.x}%` }}
					>
						{particle.emoji}
					</motion.div>
				))}
			</AnimatePresence>
		</div>
	);
}
