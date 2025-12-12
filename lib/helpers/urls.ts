/**
 * URL helper functions for external service links
 */

// External service URLs - configurable via environment
const JELLYFIN_URL = process.env.NEXT_PUBLIC_JELLYFIN_URL || "";
const SEER_URL = process.env.NEXT_PUBLIC_SEER_URL || "";

// Jellyfin server ID (required for web links)
const JELLYFIN_SERVER_ID = process.env.NEXT_PUBLIC_JELLYFIN_SERVER_ID || "";

/**
 * Get the Jellyfin web URL for an item
 * Format: https://jellyfin.example.com/web/#/details?id={itemId}&serverId={serverId}
 */
export function getJellyfinItemUrl(itemId: string): string | null {
	if (!JELLYFIN_URL || !JELLYFIN_SERVER_ID) return null;

	// Normalize item ID (remove dashes for URL)
	const normalizedId = itemId.replace(/-/g, "").toLowerCase();

	return `${JELLYFIN_URL}/web/#/details?id=${normalizedId}&serverId=${JELLYFIN_SERVER_ID}`;
}

/**
 * Get the Seer URL for a movie
 * Format: https://jellyseerr.example.com/movie/{tmdbId}
 */
export function getSeerMovieUrl(tmdbId: string): string | null {
	if (!SEER_URL || !tmdbId) return null;
	return `${SEER_URL}/movie/${tmdbId}`;
}

/**
 * Get the Seer URL for a TV show
 * Format: https://jellyseerr.example.com/tv/{tmdbId}
 */
export function getSeerTvUrl(tmdbId: string): string | null {
	if (!SEER_URL || !tmdbId) return null;
	return `${SEER_URL}/tv/${tmdbId}`;
}

/**
 * Get the best available URL for an item
 * Prioritizes Jellyfin if item exists, falls back to Seer
 */
export function getItemUrl(
	itemId: string,
	tmdbId: string | null,
	itemType: "movie" | "tv",
	existsInJellyfin: boolean,
): string | null {
	// If item exists in Jellyfin, link to Jellyfin
	if (existsInJellyfin) {
		const jellyfinUrl = getJellyfinItemUrl(itemId);
		if (jellyfinUrl) return jellyfinUrl;
	}

	// Fall back to Seer if TMDB ID is available
	if (tmdbId) {
		if (itemType === "movie") {
			return getSeerMovieUrl(tmdbId);
		}
		return getSeerTvUrl(tmdbId);
	}

	return null;
}
