"use client";

import JSConfetti from "js-confetti";
import { useEffect, useRef } from "react";

export type ConfettiType = "happy" | "thumbsup" | "stressed" | "none";

interface ConfettiProps {
	type: ConfettiType;
	intervalMs?: number;
	customEmojis?: string[];
}

const emojiSets: Record<Exclude<ConfettiType, "none">, string[]> = {
	happy: ["💚", "🍃", "❤️", "🌿", "💚", "🍀", "❤️", "🌱", "✨"],
	thumbsup: ["👍", "👍🏻", "👍🏼", "👍🏽", "👍🏾", "👍🏿", "✨", "⭐", "💫"],
	stressed: ["🥵", "😰", "😓", "💦", "🔥", "😢", "😅", "💧", "🌡️"],
};

const colorSets: Record<Exclude<ConfettiType, "none">, string[]> = {
	happy: ["#22c55e", "#16a34a", "#ef4444", "#f87171", "#86efac", "#4ade80"],
	thumbsup: ["#3b82f6", "#60a5fa", "#fbbf24", "#fcd34d", "#a78bfa", "#c4b5fd"],
	stressed: ["#f97316", "#fb923c", "#ef4444", "#fbbf24", "#dc2626", "#ea580c"],
};

export function Confetti({
	type,
	intervalMs = 6000,
	customEmojis,
}: ConfettiProps) {
	const jsConfettiRef = useRef<JSConfetti | null>(null);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		if (type === "none") return;

		// Initialize JSConfetti
		jsConfettiRef.current = new JSConfetti();

		const fireConfetti = () => {
			if (!jsConfettiRef.current) return;

			const emojis = customEmojis || emojiSets[type];
			const colors = colorSets[type];

			// Fire small regular confetti
			jsConfettiRef.current.addConfetti({
				confettiColors: colors,
				confettiNumber: 15,
				confettiRadius: 2,
			});

			// Fire extra large emoji confetti after a delay
			setTimeout(() => {
				jsConfettiRef.current?.addConfetti({
					emojis: emojis,
					emojiSize: 150,
					confettiNumber: 5,
				});
			}, 500);
		};

		// Fire immediately
		fireConfetti();

		// Set up interval for periodic confetti
		intervalRef.current = setInterval(fireConfetti, intervalMs);

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
			// JSConfetti doesn't have a destroy method, but we clear the ref
			jsConfettiRef.current = null;
		};
	}, [type, intervalMs, customEmojis]);

	// This component doesn't render anything - JSConfetti manages its own canvas
	return null;
}
