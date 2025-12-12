"use client";

import { motion } from "framer-motion";
import {
	Chrome,
	Monitor,
	RefreshCw,
	Server,
	Smartphone,
	Tablet,
	Tv,
	Zap,
} from "lucide-react";
import type {
	ClientStats,
	DeviceStats,
	PlaybackMethodStats,
} from "@/lib/data/playback";
import { streamerBlur } from "@/lib/hooks/useStreamerMode";
import { Confetti, type ConfettiType } from "../Confetti";

interface TechStatsSlideProps {
	deviceStats: DeviceStats[];
	clientStats: ClientStats[];
	playbackMethodStats: PlaybackMethodStats;
	isStreamerMode?: boolean;
}

const deviceIcons: Record<string, React.ReactNode> = {
	chrome: <Chrome className="w-5 h-5" />,
	firefox: <Monitor className="w-5 h-5" />,
	safari: <Monitor className="w-5 h-5" />,
	android: <Smartphone className="w-5 h-5" />,
	iphone: <Smartphone className="w-5 h-5" />,
	ipad: <Tablet className="w-5 h-5" />,
	tv: <Tv className="w-5 h-5" />,
	default: <Monitor className="w-5 h-5" />,
};

function getDeviceIcon(name: string) {
	const lowerName = name.toLowerCase();
	for (const [key, icon] of Object.entries(deviceIcons)) {
		if (lowerName.includes(key)) return icon;
	}
	return deviceIcons.default;
}

export function TechStatsSlide({
	deviceStats,
	clientStats,
	playbackMethodStats,
	isStreamerMode,
}: TechStatsSlideProps) {
	const topDevices = deviceStats.slice(0, 5);
	const topClients = clientStats.slice(0, 5);

	// Determine which playback method is dominant
	const directIsDominant =
		playbackMethodStats.directPercentage >=
			playbackMethodStats.remuxPercentage &&
		playbackMethodStats.directPercentage >=
			playbackMethodStats.transcodePercentage;
	const remuxIsDominant =
		playbackMethodStats.remuxPercentage >
			playbackMethodStats.directPercentage &&
		playbackMethodStats.remuxPercentage >=
			playbackMethodStats.transcodePercentage;
	const transcodeIsHigh = playbackMethodStats.transcodePercentage > 20;

	// Determine confetti type
	let confettiType: ConfettiType = "none";
	if (transcodeIsHigh) {
		confettiType = "stressed";
	} else if (directIsDominant) {
		confettiType = "happy";
	} else if (remuxIsDominant) {
		confettiType = "thumbsup";
	}

	// Determine server friendliness message (prioritize transcode warning)
	const serverFriendly =
		playbackMethodStats.directPercentage + playbackMethodStats.remuxPercentage;
	const serverMessage = transcodeIsHigh
		? "breaking-server"
		: serverFriendly >= 80
			? "Media server loves you! 💚"
			: serverFriendly >= 50
				? "Pretty good balance! 👍"
				: "breaking-server";

	return (
		<div className="w-full max-w-4xl mx-auto relative">
			<Confetti type={confettiType} intervalMs={8000} />

			<motion.div
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				className="text-center mb-6"
			>
				<h2 className="text-2xl md:text-4xl font-bold text-white">
					How You Watched
				</h2>
				<p className="text-muted-foreground mt-2">
					Your devices and streaming stats
				</p>
			</motion.div>

			{/* Playback method - NOW AT TOP */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.2 }}
				className="glass rounded-2xl p-5 mb-6"
			>
				<h3 className="text-lg font-semibold text-white mb-2 text-center">
					Playback Method
				</h3>
				<p className="text-sm text-muted-foreground text-center mb-4">
					{serverMessage === "breaking-server" ? (
						<a
							href="https://www.youtube.com/watch?v=D9-voINFkCg"
							target="_blank"
							rel="noopener noreferrer"
							className="text-orange-400 hover:text-orange-300 underline underline-offset-2"
						>
							SAMIR... YOU ARE BREAKING THE SERVER! 🥵
						</a>
					) : (
						serverMessage
					)}
				</p>
				<div className="flex items-center justify-center gap-4 md:gap-8">
					{/* Direct Play */}
					<div className="text-center flex-1">
						<div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-2 mx-auto">
							<Zap className="w-6 h-6 md:w-7 md:h-7 text-green-500" />
						</div>
						<p className="text-xl md:text-2xl font-bold text-green-500">
							{playbackMethodStats.directPercentage}%
						</p>
						<p className="text-xs text-muted-foreground">Direct</p>
					</div>

					{/* Remux */}
					<div className="text-center flex-1">
						<div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-2 mx-auto">
							<RefreshCw className="w-6 h-6 md:w-7 md:h-7 text-blue-500" />
						</div>
						<p className="text-xl md:text-2xl font-bold text-blue-500">
							{playbackMethodStats.remuxPercentage}%
						</p>
						<p className="text-xs text-muted-foreground">Remux</p>
					</div>

					{/* Transcode */}
					<div className="text-center flex-1">
						<div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-orange-500/20 flex items-center justify-center mb-2 mx-auto">
							<Server className="w-6 h-6 md:w-7 md:h-7 text-orange-500" />
						</div>
						<p className="text-xl md:text-2xl font-bold text-orange-500">
							{playbackMethodStats.transcodePercentage}%
						</p>
						<p className="text-xs text-muted-foreground">Transcode</p>
					</div>
				</div>
			</motion.div>

			<div className="grid md:grid-cols-2 gap-4">
				{/* Devices */}
				<motion.div
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ delay: 0.3 }}
					className="glass rounded-2xl p-5"
				>
					<h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
						<Monitor className="w-5 h-5 text-jellyfin" />
						Devices
					</h3>
					<div className="space-y-3">
						{topDevices.map((device, i) => (
							<motion.div
								key={device.deviceName}
								initial={{ opacity: 0, x: -10 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: 0.4 + i * 0.1 }}
								className="flex items-center gap-3"
							>
								<div className="text-jellyfin">
									{getDeviceIcon(device.deviceName)}
								</div>
								<div className="flex-1">
									<div className="flex justify-between text-sm mb-1">
										<span
											className={`text-white truncate ${isStreamerMode ? streamerBlur : ""}`}
										>
											{device.deviceName}
										</span>
										<span className="text-muted-foreground">
											{device.percentage}%
										</span>
									</div>
									<div className="h-2 bg-white/5 rounded-full overflow-hidden">
										<motion.div
											initial={{ width: 0 }}
											animate={{ width: `${device.percentage}%` }}
											transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
											className="h-full gradient-jellyfin rounded-full"
										/>
									</div>
								</div>
							</motion.div>
						))}
					</div>
				</motion.div>

				{/* Clients */}
				<motion.div
					initial={{ opacity: 0, x: 20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ delay: 0.4 }}
					className="glass rounded-2xl p-5"
				>
					<h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
						<Chrome className="w-5 h-5 text-purple-400" />
						Apps Used
					</h3>
					<div className="space-y-3">
						{topClients.map((client, i) => (
							<motion.div
								key={client.clientName}
								initial={{ opacity: 0, x: 10 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: 0.5 + i * 0.1 }}
								className="flex items-center gap-3"
							>
								<div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
									<span className="text-purple-400 font-bold text-xs">
										{client.clientName.charAt(0)}
									</span>
								</div>
								<div className="flex-1">
									<div className="flex justify-between text-sm mb-1">
										<span className="text-white truncate">
											{client.clientName}
										</span>
										<span className="text-muted-foreground">
											{client.percentage}%
										</span>
									</div>
									<div className="h-2 bg-white/5 rounded-full overflow-hidden">
										<motion.div
											initial={{ width: 0 }}
											animate={{ width: `${client.percentage}%` }}
											transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
											className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
										/>
									</div>
								</div>
							</motion.div>
						))}
					</div>
				</motion.div>
			</div>
		</div>
	);
}
