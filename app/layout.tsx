import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
	subsets: ["latin"],
	display: "swap",
	variable: "--font-inter",
});

export const metadata: Metadata = {
	title: "Media Year in Review",
	description: "Your personalized stats and highlights",
};

// Umami analytics configuration from environment variables
// Only enable if both variables are set and non-empty
const UMAMI_WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID || "";
const UMAMI_SRC = process.env.NEXT_PUBLIC_UMAMI_SRC || "";
const UMAMI_ENABLED = UMAMI_WEBSITE_ID.length > 0 && UMAMI_SRC.length > 0;

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="dark">
			<head>
				{/* Native script tag for Umami - Next.js Script component with afterInteractive
				    strategy injects scripts client-side which can lose data attributes */}
				{UMAMI_ENABLED && (
					<script
						defer
						src={UMAMI_SRC}
						data-website-id={UMAMI_WEBSITE_ID}
					/>
				)}
			</head>
			<body className={`${inter.variable} antialiased`}>{children}</body>
		</html>
	);
}
