"use client";

import { useCallback, useEffect, useState } from "react";

const COOKIE_NAME = "streamer-mode";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function getCookie(name: string): string | null {
	if (typeof document === "undefined") return null;
	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${name}=`);
	if (parts.length === 2) {
		return parts.pop()?.split(";").shift() || null;
	}
	return null;
}

function setCookie(name: string, value: string, maxAge: number): void {
	if (typeof document === "undefined") return;
	// biome-ignore lint/suspicious/noDocumentCookie: Standard cookie setting for client-side preference storage
	document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function useStreamerMode() {
	const [isStreamerMode, setIsStreamerMode] = useState(false);
	const [isLoaded, setIsLoaded] = useState(false);

	// Load initial state from cookie
	useEffect(() => {
		const cookieValue = getCookie(COOKIE_NAME);
		setIsStreamerMode(cookieValue === "true");
		setIsLoaded(true);
	}, []);

	const toggleStreamerMode = useCallback(() => {
		setIsStreamerMode((prev) => {
			const newValue = !prev;
			setCookie(COOKIE_NAME, String(newValue), COOKIE_MAX_AGE);
			return newValue;
		});
	}, []);

	const enableStreamerMode = useCallback(() => {
		setIsStreamerMode(true);
		setCookie(COOKIE_NAME, "true", COOKIE_MAX_AGE);
	}, []);

	const disableStreamerMode = useCallback(() => {
		setIsStreamerMode(false);
		setCookie(COOKIE_NAME, "false", COOKIE_MAX_AGE);
	}, []);

	return {
		isStreamerMode,
		isLoaded,
		toggleStreamerMode,
		enableStreamerMode,
		disableStreamerMode,
	};
}

/**
 * CSS class to apply blur effect to sensitive content
 * Use with: className={isStreamerMode ? streamerBlur : ""}
 */
export const streamerBlur = "blur-md select-none";
