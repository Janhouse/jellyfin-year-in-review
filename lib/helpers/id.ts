/**
 * ID normalization helpers
 *
 * PlaybackActivity uses lowercase no-dashes: "4feb1f1edebb483faa29f9ec56f3289e"
 * jellyfin.db uses uppercase with dashes: "4FEB1F1E-DEBB-483F-AA29-F9EC56F3289E"
 */

/**
 * Normalize UUID to lowercase without dashes
 */
export function normalizeId(id: string): string {
	return id.toLowerCase().replace(/-/g, "");
}

/**
 * Convert normalized ID back to UUID format (uppercase with dashes)
 */
export function toUuidFormat(id: string): string {
	const normalized = normalizeId(id);
	return [
		normalized.slice(0, 8),
		normalized.slice(8, 12),
		normalized.slice(12, 16),
		normalized.slice(16, 20),
		normalized.slice(20, 32),
	]
		.join("-")
		.toUpperCase();
}

/**
 * Check if two IDs are equal (handles both formats)
 */
export function idsMatch(id1: string, id2: string): boolean {
	return normalizeId(id1) === normalizeId(id2);
}
