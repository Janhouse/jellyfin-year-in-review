import type {
	DayOfWeekStats,
	HourlyStats,
	Marathon,
	Personality,
	PlaybackStats,
} from "@/lib/types";

/**
 * Viewer personality detection based on watching habits
 * Now with more fun and varied titles!
 */

interface PersonalityInput {
	hourlyStats: HourlyStats[];
	dayOfWeekStats: DayOfWeekStats[];
	stats: PlaybackStats;
	longestMarathon?: Marathon | null;
}

/**
 * Determine viewer personality based on watching patterns
 */
export function determinePersonality({
	hourlyStats,
	dayOfWeekStats,
	stats,
	longestMarathon,
}: PersonalityInput): Personality {
	// Find peak watching hour
	const peakHour = hourlyStats.reduce(
		(max, h) => (h.plays > max.plays ? h : max),
		hourlyStats[0],
	);

	// Find peak watching day
	const peakDay = dayOfWeekStats.reduce(
		(max, d) => (d.plays > max.plays ? d : max),
		dayOfWeekStats[0],
	);

	// Calculate weekend vs weekday ratio
	const weekendPlays = dayOfWeekStats
		.filter((d) => d.day === 0 || d.day === 6) // Sunday = 0, Saturday = 6
		.reduce((sum, d) => sum + d.plays, 0);
	const weekdayPlays = dayOfWeekStats
		.filter((d) => d.day >= 1 && d.day <= 5)
		.reduce((sum, d) => sum + d.plays, 0);

	// Calculate working hours plays (9am-5pm on weekdays)
	const workingHoursPlays = hourlyStats
		.filter((h) => h.hour >= 9 && h.hour <= 17)
		.reduce((sum, h) => sum + h.plays, 0);
	const totalPlays = hourlyStats.reduce((sum, h) => sum + h.plays, 0);
	const workingHoursRatio = totalPlays > 0 ? workingHoursPlays / totalPlays : 0;

	// Calculate late night plays (11pm - 4am)
	const lateNightPlays = hourlyStats
		.filter((h) => h.hour >= 23 || h.hour <= 4)
		.reduce((sum, h) => sum + h.plays, 0);
	const lateNightRatio = totalPlays > 0 ? lateNightPlays / totalPlays : 0;

	// Calculate lunch break plays (11am - 2pm)
	const lunchPlays = hourlyStats
		.filter((h) => h.hour >= 11 && h.hour <= 14)
		.reduce((sum, h) => sum + h.plays, 0);
	const lunchRatio = totalPlays > 0 ? lunchPlays / totalPlays : 0;

	// Calculate evening plays (6pm - 10pm)
	const eveningPlays = hourlyStats
		.filter((h) => h.hour >= 18 && h.hour <= 22)
		.reduce((sum, h) => sum + h.plays, 0);
	const eveningRatio = totalPlays > 0 ? eveningPlays / totalPlays : 0;

	// Calculate early morning plays (5am - 8am)
	const earlyMorningPlays = hourlyStats
		.filter((h) => h.hour >= 5 && h.hour <= 8)
		.reduce((sum, h) => sum + h.plays, 0);
	const earlyMorningRatio = totalPlays > 0 ? earlyMorningPlays / totalPlays : 0;

	// Check for marathon master (marathon > 8 hours)
	const isMarathonMaster = longestMarathon && longestMarathon.totalHours >= 8;

	// Check for binge watcher (episodes >> movies)
	const isBingeWatcher = stats.episodePlays > stats.moviePlays * 3;

	// Check for movie buff (movies > episodes significantly)
	const isMovieBuff = stats.moviePlays > stats.episodePlays * 1.5;

	// Is Sunday the peak day?
	const isSundayPeak = peakDay.day === 0;

	// Score each personality
	const scores: { personality: Personality; score: number }[] = [];

	// Night Owl: Most watching happens late at night
	if (lateNightRatio > 0.35 || peakHour.hour >= 23 || peakHour.hour <= 3) {
		scores.push({ personality: "Night Owl", score: lateNightRatio * 100 + 30 });
	}

	// Early Bird: Most watching happens early morning
	if (earlyMorningRatio > 0.25 || (peakHour.hour >= 5 && peakHour.hour <= 8)) {
		scores.push({
			personality: "Early Bird",
			score: earlyMorningRatio * 100 + 20,
		});
	}

	// Workday Slacker: Significant watching during work hours (9-5)
	if (workingHoursRatio > 0.4 && weekdayPlays > weekendPlays) {
		scores.push({
			personality: "Workday Slacker",
			score: workingHoursRatio * 100 + 25,
		});
	}

	// Weekend Warrior: Mostly watches on weekends
	if (weekendPlays > weekdayPlays * 1.5) {
		scores.push({
			personality: "Weekend Warrior",
			score: (weekendPlays / (weekendPlays + weekdayPlays)) * 100 + 15,
		});
	}

	// Sunday Couch Potato: Sunday is by far the peak day
	if (isSundayPeak && peakDay.plays > (totalPlays / 7) * 1.8) {
		scores.push({
			personality: "Sunday Couch Potato",
			score: (peakDay.plays / totalPlays) * 100 + 20,
		});
	}

	// Lunch Break Legend: Peak watching during lunch hours
	if (lunchRatio > 0.3 || (peakHour.hour >= 11 && peakHour.hour <= 14)) {
		scores.push({
			personality: "Lunch Break Legend",
			score: lunchRatio * 100 + 15,
		});
	}

	// After Hours Addict: Peak is right after typical work hours (5-8pm)
	if (peakHour.hour >= 17 && peakHour.hour <= 20) {
		scores.push({ personality: "After Hours Addict", score: 35 });
	}

	// Prime Time Purist: Most watching during traditional prime time (7-10pm)
	if (eveningRatio > 0.5) {
		scores.push({
			personality: "Prime Time Purist",
			score: eveningRatio * 100 + 10,
		});
	}

	// Twilight Viewer: Peak at twilight hours (5-7pm)
	if (peakHour.hour >= 17 && peakHour.hour <= 19 && eveningRatio > 0.3) {
		scores.push({ personality: "Twilight Viewer", score: 30 });
	}

	// Marathon Master: Has impressive marathon sessions
	if (isMarathonMaster) {
		scores.push({
			personality: "Marathon Master",
			score: (longestMarathon?.totalHours || 0) * 5 + 30,
		});
	}

	// Binge Watcher: Way more episodes than movies
	if (isBingeWatcher) {
		scores.push({
			personality: "Binge Watcher",
			score:
				(stats.episodePlays / (stats.episodePlays + stats.moviePlays)) * 50 +
				20,
		});
	}

	// Movie Buff: Prefers movies over shows
	if (isMovieBuff) {
		scores.push({
			personality: "Movie Buff",
			score:
				(stats.moviePlays / (stats.episodePlays + stats.moviePlays)) * 50 + 15,
		});
	}

	// The Dedicated One: Very high total hours
	if (stats.totalHours > 500) {
		scores.push({
			personality: "The Dedicated One",
			score: Math.min(stats.totalHours / 10, 60),
		});
	}

	// Sort by score and return the highest
	scores.sort((a, b) => b.score - a.score);

	if (scores.length > 0) {
		return scores[0].personality;
	}

	return "Casual Viewer";
}

/**
 * Get a fun description for the personality
 */
export function getPersonalityDescription(personality: Personality): string {
	switch (personality) {
		case "Marathon Master":
			return "You've mastered the art of the extended watch session!";
		case "Night Owl":
			return "The night is your domain for peak entertainment.";
		case "Early Bird":
			return "You catch shows while others catch Z's.";
		case "Binge Watcher":
			return "Just one more episode... said nobody ever.";
		case "Movie Buff":
			return "Feature-length is your preferred format.";
		case "Casual Viewer":
			return "A balanced viewer with diverse tastes.";
		case "Weekend Warrior":
			return "Saving the binge for when it counts!";
		case "Workday Slacker":
			return "Who needs productivity when there's content?";
		case "Lunch Break Legend":
			return "Turning lunch hour into watch hour!";
		case "After Hours Addict":
			return "Work's done, time to unwind!";
		case "Sunday Couch Potato":
			return "Sunday is for shows, as intended.";
		case "Twilight Viewer":
			return "The golden hour is your viewing hour.";
		case "The Dedicated One":
			return "Your commitment to content is legendary!";
		case "Prime Time Purist":
			return "Traditional viewing hours, timeless taste.";
	}
}

/**
 * Get an emoji for the personality
 */
export function getPersonalityEmoji(personality: Personality): string {
	switch (personality) {
		case "Marathon Master":
			return "🏃";
		case "Night Owl":
			return "🦉";
		case "Early Bird":
			return "🐦";
		case "Binge Watcher":
			return "📺";
		case "Movie Buff":
			return "🎬";
		case "Casual Viewer":
			return "🍿";
		case "Weekend Warrior":
			return "⚔️";
		case "Workday Slacker":
			return "🤫";
		case "Lunch Break Legend":
			return "🥪";
		case "After Hours Addict":
			return "🌆";
		case "Sunday Couch Potato":
			return "🛋️";
		case "Twilight Viewer":
			return "🌅";
		case "The Dedicated One":
			return "👑";
		case "Prime Time Purist":
			return "📡";
	}
}
