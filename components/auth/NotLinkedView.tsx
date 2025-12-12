"use client";

import { motion } from "framer-motion";
import { AlertCircle, LogOut, UserX } from "lucide-react";
import { authClient } from "@/lib/auth-client";

interface NotLinkedViewProps {
	userName: string;
	jellyfinUsername?: string;
}

export function NotLinkedView({
	userName,
	jellyfinUsername,
}: NotLinkedViewProps) {
	const handleLogout = async () => {
		await authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					window.location.href = "/login";
				},
			},
		});
	};

	return (
		<div className="min-h-screen gradient-mesh flex items-center justify-center p-4">
			<motion.div
				initial={{ scale: 0.9, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={{ type: "spring" }}
				className="glass rounded-3xl p-8 max-w-md w-full text-center"
			>
				{/* Icon */}
				<motion.div
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					transition={{ delay: 0.2, type: "spring" }}
					className="mb-6"
				>
					<div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-500/20 mb-4">
						<UserX className="w-10 h-10 text-yellow-500" />
					</div>
				</motion.div>

				{/* Message */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.3 }}
				>
					<h1 className="text-2xl font-bold text-white mb-2">
						Hello, {userName}!
					</h1>
					<p className="text-muted-foreground mb-6">
						Your SSO account is not linked to a Jellyfin user.
					</p>
				</motion.div>

				{/* Details */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.4 }}
					className="bg-white/5 rounded-xl p-4 mb-6"
				>
					<div className="flex items-start gap-3 text-left">
						<AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
						<div className="text-sm text-muted-foreground">
							{jellyfinUsername ? (
								<>
									<p className="mb-2">
										Your SSO account has Jellyfin username{" "}
										<span className="font-mono text-white">
											"{jellyfinUsername}"
										</span>
										, but no matching Jellyfin user was found.
									</p>
									<p>
										Please contact your administrator to ensure your Jellyfin
										account exists with this username.
									</p>
								</>
							) : (
								<>
									<p className="mb-2">
										Your SSO account doesn't have a Jellyfin username linked.
									</p>
									<p>
										Please contact your administrator to link your Jellyfin
										username to your SSO account.
									</p>
								</>
							)}
						</div>
					</div>
				</motion.div>

				{/* Logout Button */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.5 }}
				>
					<button
						type="button"
						onClick={handleLogout}
						className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-all"
					>
						<LogOut className="w-5 h-5" />
						Sign out
					</button>
				</motion.div>
			</motion.div>
		</div>
	);
}
