/**
 * Authentik API Service
 * Fetches user information from Authentik for email and name lookup
 */

const AUTHENTIK_URL = process.env.AUTHENTIK_URL;
const AUTHENTIK_API_TOKEN = process.env.AUTHENTIK_API_TOKEN;
const AUTHENTIK_JELLYFIN_GROUP =
	process.env.AUTHENTIK_JELLYFIN_GROUP || "Jellyfin";
const AUTHENTIK_JELLYFIN_USERNAME_ATTRIBUTE =
	process.env.AUTHENTIK_JELLYFIN_USERNAME_ATTRIBUTE || "jellyfin_username";
const AUTHENTIK_JELLYFIN_TIMEZONE_ATTRIBUTE =
	process.env.AUTHENTIK_JELLYFIN_TIMEZONE_ATTRIBUTE || "jellyfin_timezone";

export interface AuthentikUser {
	pk: number;
	username: string;
	name: string;
	email: string;
	attributes: Record<string, unknown>;
}

interface AuthentikUsersResponse {
	pagination: {
		count: number;
		current: number;
		total_pages: number;
		next?: number;
		previous?: number;
	};
	results: AuthentikUser[];
}

/**
 * Check if Authentik integration is configured
 */
export function isAuthentikConfigured(): boolean {
	return !!(AUTHENTIK_URL && AUTHENTIK_API_TOKEN);
}

export interface AuthentikUserInfo {
	email: string;
	name: string;
	authentikUsername: string;
	timezone: string | null;
}

/**
 * Get Authentik user info by jellyfin username using direct API query
 */
export async function getAuthentikUserByJellyfinUsername(
	jellyfinUsername: string,
): Promise<AuthentikUserInfo | null> {
	if (!isAuthentikConfigured()) {
		return null;
	}

	try {
		const url = new URL(`${AUTHENTIK_URL}/api/v3/core/users/`);
		url.searchParams.set("include_groups", AUTHENTIK_JELLYFIN_GROUP);
		// Query by attribute: {"jellyfin_username": "username"}
		const attributesQuery = JSON.stringify({
			[AUTHENTIK_JELLYFIN_USERNAME_ATTRIBUTE]: jellyfinUsername,
		});
		url.searchParams.set("attributes", attributesQuery);

		const response = await fetch(url.toString(), {
			headers: {
				Authorization: `Bearer ${AUTHENTIK_API_TOKEN}`,
				Accept: "application/json",
			},
		});

		if (!response.ok) {
			console.error(
				`Authentik API error: ${response.status} ${response.statusText}`,
			);
			return null;
		}

		const data: AuthentikUsersResponse = await response.json();

		if (data.results.length === 0) {
			return null;
		}

		const user = data.results[0];
		const timezone = user.attributes[AUTHENTIK_JELLYFIN_TIMEZONE_ATTRIBUTE];
		return {
			email: user.email,
			name: user.name || user.username,
			authentikUsername: user.username,
			timezone: typeof timezone === "string" ? timezone : null,
		};
	} catch (error) {
		console.error("Failed to fetch Authentik user:", error);
		return null;
	}
}

/**
 * Fetch all users from Authentik that are in the jellyfin group
 */
export async function getAuthentikJellyfinUsers(): Promise<AuthentikUser[]> {
	if (!isAuthentikConfigured()) {
		console.warn("Authentik not configured, skipping user fetch");
		return [];
	}

	const allUsers: AuthentikUser[] = [];
	let page = 1;
	let hasMore = true;

	try {
		while (hasMore) {
			const url = new URL(`${AUTHENTIK_URL}/api/v3/core/users/`);
			url.searchParams.set("include_groups", AUTHENTIK_JELLYFIN_GROUP);
			url.searchParams.set("page", page.toString());
			url.searchParams.set("page_size", "100");

			const response = await fetch(url.toString(), {
				headers: {
					Authorization: `Bearer ${AUTHENTIK_API_TOKEN}`,
					Accept: "application/json",
				},
			});

			if (!response.ok) {
				// 404 with "Invalid page" means we've gone past the last page - not an error
				if (response.status === 404) {
					break;
				}
				const errorBody = await response.text();
				console.error("Authentik API error body:", errorBody);
				throw new Error(
					`Authentik API error: ${response.status} ${response.statusText}`,
				);
			}

			const data: AuthentikUsersResponse = await response.json();
			allUsers.push(...data.results);

			// Check if there's a next page
			hasMore = page < data.pagination.total_pages;
			page++;
		}

		return allUsers;
	} catch (error) {
		console.error("Failed to fetch Authentik users:", error);
		return [];
	}
}

/**
 * Create a map of jellyfin_username -> Authentik user info
 */
export async function getJellyfinUserMap(): Promise<
	Map<string, AuthentikUserInfo>
> {
	const authentikUsers = await getAuthentikJellyfinUsers();
	const map = new Map<string, AuthentikUserInfo>();

	for (const user of authentikUsers) {
		const jellyfinUsername =
			user.attributes[AUTHENTIK_JELLYFIN_USERNAME_ATTRIBUTE];
		if (typeof jellyfinUsername === "string") {
			const timezone = user.attributes[AUTHENTIK_JELLYFIN_TIMEZONE_ATTRIBUTE];
			// Store with lowercase key for case-insensitive matching
			map.set(jellyfinUsername.toLowerCase(), {
				email: user.email,
				name: user.name || user.username,
				authentikUsername: user.username,
				timezone: typeof timezone === "string" ? timezone : null,
			});
		}
	}

	return map;
}
