import { betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins";
import { headers } from "next/headers";

export const auth = betterAuth({
	// No database - use stateless JWT sessions
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 30 * 24 * 60 * 60, // 30 days
			strategy: "jwt",
			refreshCache: true,
		},
	},
	account: {
		storeStateStrategy: "cookie",
		storeAccountCookie: true,
	},
	plugins: [
		genericOAuth({
			config: [
				{
					providerId: "authentik",
					clientId: process.env.AUTHENTIK_CLIENT_ID ?? "",
					clientSecret: process.env.AUTHENTIK_CLIENT_SECRET ?? "",
					discoveryUrl: `${process.env.AUTH_AUTHENTIK_ISSUER}.well-known/openid-configuration`,
					scopes: ["openid", "profile", "email", "jellyfin"],
					pkce: true,
					// Use POST body for client credentials (authentik prefers this)
					authentication: "post",
					getUserInfo: async (tokens) => {
						// Authentik userinfo endpoint - use AUTHENTIK_USERINFO_URL or derive from issuer
						const userInfoUrl =
							process.env.AUTHENTIK_USERINFO_URL ||
							`${process.env.AUTH_AUTHENTIK_ISSUER?.replace(/\/application\/o\/[^/]+\/$/, "/application/o/userinfo/")}`;

						const response = await fetch(userInfoUrl, {
							headers: {
								Authorization: `Bearer ${tokens.accessToken}`,
							},
						});

						if (!response.ok) {
							const errorText = await response.text();
							throw new Error(
								`UserInfo request failed: ${response.status} - ${errorText}`,
							);
						}

						const userInfo = await response.json();

						return {
							id: userInfo.sub,
							name: userInfo.name || userInfo.preferred_username,
							email: userInfo.email,
							image: userInfo.picture,
							emailVerified: userInfo.email_verified || false,
							// Include jellyfin_username from the jellyfin scope
							jellyfinUsername: userInfo.jellyfin_username || null,
							// Include jellyfin_timezone from the jellyfin scope
							jellyfinTimezone: userInfo.jellyfin_timezone || null,
							// Store groups as JSON string for admin checks
							groups: JSON.stringify(userInfo.groups || []),
						};
					},
				},
			],
		}),
	],
	user: {
		additionalFields: {
			jellyfinUsername: {
				type: "string",
				required: false,
			},
			jellyfinTimezone: {
				type: "string",
				required: false,
			},
			groups: {
				type: "string",
				required: false,
			},
		},
	},
});

/**
 * Get the current session (server-side)
 */
export async function getSession() {
	const headersList = await headers();
	return auth.api.getSession({
		headers: headersList,
	});
}

/**
 * User type with additional fields
 */
interface UserWithGroups {
	jellyfinUsername?: string;
	jellyfinTimezone?: string;
	groups?: string;
}

/**
 * Check if the current user is an admin (member of "admin" group)
 */
export async function isAdmin(): Promise<boolean> {
	const session = await getSession();
	if (!session?.user) return false;

	const user = session.user as UserWithGroups;
	if (!user.groups) return false;

	try {
		const groups = JSON.parse(user.groups) as string[];
		return groups.includes("admin");
	} catch {
		return false;
	}
}

/**
 * Check if the current user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
	const session = await getSession();
	return !!session?.user;
}

/**
 * Get the Jellyfin username from the current session
 */
export async function getJellyfinUsername(): Promise<string | null> {
	const session = await getSession();
	if (!session?.user) return null;
	return (session.user as UserWithGroups).jellyfinUsername || null;
}

/**
 * Get the Jellyfin timezone from the current session
 * Returns null if not set (will use default TIMEZONE from env)
 */
export async function getJellyfinTimezone(): Promise<string | null> {
	const session = await getSession();
	if (!session?.user) return null;
	return (session.user as UserWithGroups).jellyfinTimezone || null;
}

/**
 * Get the SSO display name from the current session
 */
export async function getSsoDisplayName(): Promise<string | null> {
	const session = await getSession();
	if (!session?.user) return null;
	return session.user.name || null;
}

export type Session = Awaited<ReturnType<typeof auth.api.getSession>>;
