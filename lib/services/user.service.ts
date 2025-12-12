import {
	findAllUserHoursForYear,
	findAllUsers,
	findAvailableYears,
	findUserById,
	findUserByUsername,
	findUsersWithPlayback,
} from "@/lib/dao";
import { normalizeId } from "@/lib/helpers";
import type { User } from "@/lib/types";
import { getJellyfinUserMap } from "./authentik.service";

/**
 * User Service
 * Business logic for user operations
 */

/**
 * Get all users from the database
 */
export function getUsers(): User[] {
	const users = findAllUsers();

	return users.map((user) => ({
		id: user.Id,
		username: user.Username,
		normalizedId: normalizeId(user.Id),
	}));
}

/**
 * Get user by ID (accepts either format)
 */
export function getUserById(id: string): User | null {
	const user = findUserById(id);
	if (!user) return null;

	return {
		id: user.Id,
		username: user.Username,
		normalizedId: normalizeId(user.Id),
	};
}

/**
 * Get user by username (case-insensitive)
 */
export function getUserByUsername(username: string): User | null {
	const user = findUserByUsername(username);
	if (!user) return null;

	return {
		id: user.Id,
		username: user.Username,
		normalizedId: normalizeId(user.Id),
	};
}

/**
 * Get users who have playback activity
 */
export function getActiveUsers(): User[] {
	const playbackUsers = findUsersWithPlayback();
	const activeUserIds = new Set(
		playbackUsers.map((u) => normalizeId(u.UserId)),
	);

	const allUsers = getUsers();
	return allUsers.filter((user) => activeUserIds.has(user.normalizedId));
}

/**
 * Get available years for a user
 */
export function getAvailableYears(userId: string): number[] {
	const years = findAvailableYears(userId);
	return years.map((y) => Number.parseInt(y.year, 10));
}

export interface UserRanking {
	rank: number;
	totalUsers: number;
	percentile: number;
	topViewerHours: number;
}

/**
 * Get user's ranking among all users for a year
 */
export function getUserRanking(userId: string, year: number): UserRanking {
	const allUserHours = findAllUserHoursForYear(year);
	const normalizedUserId = normalizeId(userId);

	const totalUsers = allUserHours.length;
	const topViewerHours = allUserHours[0]?.totalHours || 0;

	const userIndex = allUserHours.findIndex(
		(u) => u.userId === normalizedUserId,
	);
	const rank = userIndex >= 0 ? userIndex + 1 : totalUsers;

	// Percentile: what percent of users you're ahead of
	const percentile =
		totalUsers > 1
			? Math.round(((totalUsers - rank) / (totalUsers - 1)) * 100)
			: 100;

	return {
		rank,
		totalUsers,
		percentile,
		topViewerHours: Math.round(topViewerHours * 10) / 10,
	};
}

export interface UserWithHours {
	id: string;
	username: string;
	normalizedId: string;
	totalHours: number;
	rank: number;
	// From Authentik (optional)
	email?: string;
	displayName?: string;
}

/**
 * Get all users with their total hours for a year, sorted by hours descending
 */
export function getUsersWithHours(year: number, minHours = 0): UserWithHours[] {
	const allUserHours = findAllUserHoursForYear(year);
	const allUsers = getUsers();

	// Create a map of normalized ID to user
	const userMap = new Map<string, User>();
	for (const user of allUsers) {
		userMap.set(user.normalizedId, user);
	}

	// Join user hours with user info
	const usersWithHours: UserWithHours[] = [];

	for (let i = 0; i < allUserHours.length; i++) {
		const userHours = allUserHours[i];
		const user = userMap.get(userHours.userId);

		if (user && userHours.totalHours >= minHours) {
			usersWithHours.push({
				id: user.id,
				username: user.username,
				normalizedId: user.normalizedId,
				totalHours: Math.round(userHours.totalHours * 10) / 10,
				rank: i + 1,
			});
		}
	}

	return usersWithHours;
}

/**
 * Get all users with their total hours for a year, enriched with Authentik data
 */
export async function getUsersWithHoursAndEmail(
	year: number,
	minHours = 0,
): Promise<UserWithHours[]> {
	const users = getUsersWithHours(year, minHours);

	// Fetch Authentik user map
	const authentikMap = await getJellyfinUserMap();

	// Enrich users with Authentik data
	for (const user of users) {
		const authentikInfo = authentikMap.get(user.username.toLowerCase());
		if (authentikInfo) {
			user.email = authentikInfo.email;
			user.displayName = authentikInfo.name;
		}
	}

	return users;
}
