"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
	value: number;
	className?: string;
	duration?: number;
	decimals?: number;
}

export function AnimatedNumber({
	value,
	className = "",
	duration = 1.5,
	decimals = 0,
}: AnimatedNumberProps) {
	const [isVisible, setIsVisible] = useState(false);
	const ref = useRef<HTMLSpanElement>(null);

	const spring = useSpring(0, {
		mass: 1,
		stiffness: 75,
		damping: 15,
		duration: duration * 1000,
	});

	const display = useTransform(spring, (current) => {
		if (decimals > 0) {
			return current.toLocaleString(undefined, {
				minimumFractionDigits: decimals,
				maximumFractionDigits: decimals,
			});
		}
		return Math.round(current).toLocaleString();
	});

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting && !isVisible) {
					setIsVisible(true);
					spring.set(value);
				}
			},
			{ threshold: 0.5 },
		);

		if (ref.current) {
			observer.observe(ref.current);
		}

		return () => observer.disconnect();
	}, [value, spring, isVisible]);

	// Also trigger when value changes
	useEffect(() => {
		if (isVisible) {
			spring.set(value);
		}
	}, [value, spring, isVisible]);

	return (
		<motion.span ref={ref} className={className}>
			{display}
		</motion.span>
	);
}
