"use client";

import { motion } from "framer-motion";
import { LogIn, Sparkles } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export function LoginView() {
	const handleLogin = async () => {
		await authClient.signIn.oauth2({
			providerId: "authentik",
			callbackURL: "/",
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
				{/* Logo/Header */}
				<motion.div
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					transition={{ delay: 0.2, type: "spring" }}
					className="mb-8"
				>
					<div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-jellyfin/20 mb-4">
						<Sparkles className="w-10 h-10 text-jellyfin" />
					</div>
					<h1 className="text-3xl font-bold text-white mb-2">Year in Review</h1>
				</motion.div>

				{/* Login Button */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.4 }}
				>
					<button
						type="button"
						onClick={handleLogin}
						className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-jellyfin hover:bg-jellyfin/80 rounded-xl text-white font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
					>
						<LogIn className="w-5 h-5" />
						Sign in with SSO
					</button>
				</motion.div>

				{/* Footer */}
				<motion.p
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.6 }}
					className="mt-6 text-sm text-muted-foreground"
				>
					Sign in with your account to view your personalized stats
				</motion.p>
			</motion.div>
		</div>
	);
}
