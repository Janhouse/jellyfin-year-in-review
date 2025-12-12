import type { NextConfig } from "next";

// Allow Umami script domain if configured
const UMAMI_SRC = process.env.NEXT_PUBLIC_UMAMI_SRC || "";
const umamiDomain = UMAMI_SRC ? new URL(UMAMI_SRC).origin : "";

// Allowed dev origins from env (comma-separated)
const allowedDevOrigins = process.env.ALLOWED_DEV_ORIGINS
	? process.env.ALLOWED_DEV_ORIGINS.split(",").map((o) => o.trim())
	: ["localhost:*"];

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: https://unpkg.com ${umamiDomain};
  style-src 'self' 'unsafe-inline';
  img-src * blob: data:;
  media-src 'none';
  connect-src * ${umamiDomain};
  font-src 'self';
  object-src 'none';
`
	.replace(/\n/g, "")
	.replace(/\s+/g, " ")
	.trim();

const securityHeaders = [
	{ key: "Content-Security-Policy", value: ContentSecurityPolicy },
	{ key: "Referrer-Policy", value: "origin-when-cross-origin" },
	{ key: "X-Frame-Options", value: "SAMEORIGIN" },
	{ key: "X-Content-Type-Options", value: "nosniff" },
	{ key: "X-DNS-Prefetch-Control", value: "on" },
	{
		key: "Strict-Transport-Security",
		value: "max-age=31536000; includeSubDomains; preload",
	},
	{
		key: "Permissions-Policy",
		value:
			"camera=(), microphone=(), geolocation=(), payment=(), display-capture=(), usb=()",
	},
];

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "image.tmdb.org",
				pathname: "/t/p/**",
			},
		],
	},
	allowedDevOrigins,
	basePath: process.env.VFA_BASE_PATH,
	assetPrefix:
		process.env.NODE_ENV === "production"
			? process.env.VFA_BASE_PATH
			: undefined,
	output: "standalone",
	reactCompiler: true,
	reactStrictMode: false, // true to test hooks
	experimental: {
		turbopackFileSystemCacheForDev: true,
	},
	headers() {
		return [{ source: "/(.*)", headers: securityHeaders }];
	},
	generateBuildId: async () => {
		// Get tag of current branch(that is HEAD) or fallback to short commit hash (7 digits)
		return require("node:child_process")
			.execSync(
				`git describe --exact-match --tags 2> /dev/null || git rev-parse --short HEAD`,
			)
			.toString()
			.trim();
	},
};

export default nextConfig;
