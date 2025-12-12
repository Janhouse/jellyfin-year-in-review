"use client";

import {
	Check,
	Clock,
	Copy,
	ExternalLink,
	Eye,
	EyeOff,
	FileText,
	Filter,
	Loader2,
	LogOut,
	Mail,
	Moon,
	RefreshCw,
	Save,
	Send,
	Sun,
	Users,
	Video,
	VideoOff,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { streamerBlur, useStreamerMode } from "@/lib/hooks/useStreamerMode";
import type { UserWithHours } from "@/lib/services";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "";

function generatePlainTextEmail(
	year: number,
	reviewLink: string,
	name: string,
): string {
	return `Your ${year} Year in Review

Hey ${name}! Your personalized streaming stats are ready. See how much you watched, your favorite movies and shows, and see how you rank against others.

View your review here: ${reviewLink}

---
If you don't want to receive these emails, just reply and let me know.
`;
}

interface AdminUsersViewProps {
	year: number;
	availableYears: number[];
	minHours: number;
	users: UserWithHours[];
}

export function AdminUsersView({
	year,
	availableYears,
	minHours,
	users,
}: AdminUsersViewProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [copiedId, setCopiedId] = useState<string | null>(null);
	const [minHoursInput, setMinHoursInput] = useState(minHours.toString());
	const { isStreamerMode, toggleStreamerMode } = useStreamerMode();

	// Email state
	const [emailSubject, setEmailSubject] = useState(
		`Your ${year} Media Year in Review is ready!`,
	);
	const [emailTemplate, setEmailTemplate] = useState("");
	const [templateLoading, setTemplateLoading] = useState(true);
	const [savingTemplate, setSavingTemplate] = useState(false);
	const [testEmail, setTestEmail] = useState("");
	const [sendingEmail, setSendingEmail] = useState(false);
	const [emailStatus, setEmailStatus] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);
	const [showPreview, setShowPreview] = useState(false);
	const [previewDarkMode, setPreviewDarkMode] = useState(false);
	const [showTextPreview, setShowTextPreview] = useState(false);
	const [sendingToAll, setSendingToAll] = useState(false);
	const [bulkSendProgress, setBulkSendProgress] = useState<{
		sent: number;
		failed: number;
		total: number;
	} | null>(null);

	// Load email template from file
	const loadTemplate = async () => {
		setTemplateLoading(true);
		try {
			const response = await fetch("/api/email-template");
			if (response.ok) {
				const data = await response.json();
				setEmailTemplate(data.template);
			}
		} catch (error) {
			console.error("Failed to load email template:", error);
		} finally {
			setTemplateLoading(false);
		}
	};

	// Save email template to file
	const saveTemplate = async () => {
		setSavingTemplate(true);
		setEmailStatus(null);
		try {
			const response = await fetch("/api/email-template", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ template: emailTemplate }),
			});
			if (response.ok) {
				setEmailStatus({ type: "success", message: "Template saved to file" });
			} else {
				const data = await response.json();
				throw new Error(data.error || "Failed to save template");
			}
		} catch (error) {
			setEmailStatus({
				type: "error",
				message:
					error instanceof Error ? error.message : "Failed to save template",
			});
		} finally {
			setSavingTemplate(false);
		}
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: loadTemplate should only run once on mount
	useEffect(() => {
		loadTemplate();
	}, []);

	const handleYearChange = (newYear: number) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set("year", newYear.toString());
		router.push(`/admin?${params.toString()}`);
	};

	const handleMinHoursSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const params = new URLSearchParams(searchParams.toString());
		params.set("minHours", minHoursInput);
		router.push(`/admin?${params.toString()}`);
	};

	const copyLink = async (userId: string) => {
		const baseUrl = window.location.origin;
		const link = `${baseUrl}/review/${userId}?year=${year}`;
		await navigator.clipboard.writeText(link);
		setCopiedId(userId);
		setTimeout(() => setCopiedId(null), 2000);
	};

	const copyAllLinks = async () => {
		const baseUrl = window.location.origin;
		const links = users
			.map(
				(user) =>
					`${user.username}: ${baseUrl}/review/${user.normalizedId}?year=${year}`,
			)
			.join("\n");
		await navigator.clipboard.writeText(links);
		setCopiedId("all");
		setTimeout(() => setCopiedId(null), 2000);
	};

	const openReview = (userId: string) => {
		// Admins can access any user's review directly
		router.push(`/review/${userId}?year=${year}`);
	};

	const sendTestEmail = async () => {
		if (!testEmail) {
			setEmailStatus({
				type: "error",
				message: "Please enter a test email address",
			});
			return;
		}

		if (!APP_URL) {
			setEmailStatus({
				type: "error",
				message: "NEXT_PUBLIC_APP_URL is not configured",
			});
			return;
		}

		setSendingEmail(true);
		setEmailStatus(null);

		const reviewLink = `${APP_URL}/?year=${year}`;

		try {
			const response = await fetch("/api/send-email", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					to: testEmail,
					subject: emailSubject,
					html: emailTemplate
						.replace(/\{\{REVIEW_LINK\}\}/g, reviewLink)
						.replace(/\{\{YEAR\}\}/g, year.toString())
						.replace(/\{\{NAME\}\}/g, "User"),
					text: generatePlainTextEmail(year, reviewLink, "User"),
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to send email");
			}

			setEmailStatus({
				type: "success",
				message: `Test email sent to ${testEmail}`,
			});
		} catch (error) {
			setEmailStatus({
				type: "error",
				message:
					error instanceof Error ? error.message : "Failed to send email",
			});
		} finally {
			setSendingEmail(false);
		}
	};

	const usersWithEmail = users.filter((u) => u.email);

	const handleLogout = async () => {
		await authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					window.location.href = "/login";
				},
			},
		});
	};

	const sendToAllUsers = async () => {
		if (!APP_URL) {
			setEmailStatus({
				type: "error",
				message: "NEXT_PUBLIC_APP_URL is not configured",
			});
			return;
		}

		if (usersWithEmail.length === 0) {
			setEmailStatus({
				type: "error",
				message: "No users with email addresses found",
			});
			return;
		}

		const confirmed = window.confirm(
			`Are you sure you want to send emails to ${usersWithEmail.length} users?`,
		);
		if (!confirmed) return;

		setSendingToAll(true);
		setEmailStatus(null);
		setBulkSendProgress({ sent: 0, failed: 0, total: usersWithEmail.length });

		let sent = 0;
		let failed = 0;

		for (const user of usersWithEmail) {
			const reviewLink = `${APP_URL}/review/${user.normalizedId}?year=${year}`;
			// Format: "Name <email@domain.ext>" or just email if no display name
			const toAddress = user.displayName
				? `${user.displayName} <${user.email}>`
				: user.email;
			// Extract first name from display name, fallback to username
			const firstName = user.displayName
				? user.displayName.split(" ")[0]
				: user.username;

			try {
				const response = await fetch("/api/send-email", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						to: toAddress,
						subject: emailSubject,
						html: emailTemplate
							.replace(/\{\{REVIEW_LINK\}\}/g, reviewLink)
							.replace(/\{\{YEAR\}\}/g, year.toString())
							.replace(/\{\{NAME\}\}/g, firstName),
						text: generatePlainTextEmail(year, reviewLink, firstName),
					}),
				});

				if (response.ok) {
					sent++;
				} else {
					failed++;
				}
			} catch {
				failed++;
			}

			setBulkSendProgress({ sent, failed, total: usersWithEmail.length });
		}

		setSendingToAll(false);
		setEmailStatus({
			type: failed === 0 ? "success" : "error",
			message: `Sent ${sent} emails${failed > 0 ? `, ${failed} failed` : ""}`,
		});
	};

	return (
		<div className="min-h-screen gradient-mesh p-4 md:p-8">
			<div className="max-w-4xl mx-auto">
				{/* Header */}
				<div className="glass rounded-2xl p-6 mb-6">
					<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
						<div>
							<h1 className="text-2xl md:text-3xl font-bold text-white">
								User Watch Statistics
							</h1>
							<p className="text-muted-foreground mt-1">
								Users who watched at least {minHours} hours in {year}
							</p>
						</div>
						<div className="flex items-center gap-4">
							<div className="flex items-center gap-2">
								<Users className="w-5 h-5 text-jellyfin" />
								<span className="text-xl font-semibold text-white">
									{users.length} users
								</span>
							</div>
							<button
								type="button"
								onClick={toggleStreamerMode}
								className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors ${
									isStreamerMode
										? "bg-purple-500/30 hover:bg-purple-500/40 border border-purple-500/50"
										: "bg-white/10 hover:bg-white/20"
								}`}
								title={
									isStreamerMode
										? "Disable streamer mode"
										: "Enable streamer mode"
								}
							>
								{isStreamerMode ? (
									<VideoOff className="w-4 h-4" />
								) : (
									<Video className="w-4 h-4" />
								)}
								<span className="hidden md:inline">
									{isStreamerMode ? "Streamer Mode" : "Streamer Mode"}
								</span>
							</button>
							<button
								type="button"
								onClick={handleLogout}
								className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
								title="Sign out"
							>
								<LogOut className="w-4 h-4" />
								<span className="hidden md:inline">Sign out</span>
							</button>
						</div>
					</div>
				</div>

				{/* Filters */}
				<div className="glass rounded-2xl p-6 mb-6">
					<div className="flex flex-col md:flex-row gap-4">
						{/* Year selector */}
						<div className="flex-1">
							<label
								htmlFor="year-select"
								className="block text-sm text-muted-foreground mb-2"
							>
								Year
							</label>
							<select
								id="year-select"
								value={year}
								onChange={(e) => handleYearChange(Number(e.target.value))}
								className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-jellyfin"
							>
								{availableYears.map((y) => (
									<option key={y} value={y} className="bg-gray-900">
										{y}
									</option>
								))}
							</select>
						</div>

						{/* Min hours filter */}
						<form onSubmit={handleMinHoursSubmit} className="flex-1">
							<label
								htmlFor="min-hours-input"
								className="block text-sm text-muted-foreground mb-2"
							>
								Minimum Hours
							</label>
							<div className="flex gap-2">
								<input
									id="min-hours-input"
									type="number"
									value={minHoursInput}
									onChange={(e) => setMinHoursInput(e.target.value)}
									min="0"
									step="0.1"
									className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-jellyfin"
								/>
								<button
									type="submit"
									className="px-4 py-2 bg-jellyfin hover:bg-jellyfin/80 rounded-lg text-white transition-colors"
								>
									<Filter className="w-5 h-5" />
								</button>
							</div>
						</form>
					</div>
				</div>

				{/* Copy all button */}
				{users.length > 0 && (
					<div className="flex justify-end mb-4">
						<button
							type="button"
							onClick={copyAllLinks}
							className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
						>
							{copiedId === "all" ? (
								<Check className="w-4 h-4 text-green-400" />
							) : (
								<Copy className="w-4 h-4" />
							)}
							Copy All Links
						</button>
					</div>
				)}

				{/* Users table */}
				<div className="glass rounded-2xl overflow-hidden">
					{users.length === 0 ? (
						<div className="p-8 text-center">
							<p className="text-muted-foreground">
								No users found with at least {minHours} hours watched.
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead>
									<tr className="border-b border-white/10">
										<th className="text-left p-4 text-muted-foreground font-medium">
											Rank
										</th>
										<th className="text-left p-4 text-muted-foreground font-medium">
											Username
										</th>
										<th className="text-left p-4 text-muted-foreground font-medium">
											Email
										</th>
										<th className="text-right p-4 text-muted-foreground font-medium">
											Hours
										</th>
										<th className="text-right p-4 text-muted-foreground font-medium">
											Actions
										</th>
									</tr>
								</thead>
								<tbody>
									{users.map((user) => (
										<tr
											key={user.normalizedId}
											className="border-b border-white/5 hover:bg-white/5 transition-colors"
										>
											<td className="p-4">
												<span className="text-jellyfin font-semibold">
													#{user.rank}
												</span>
											</td>
											<td className="p-4">
												<div className={isStreamerMode ? streamerBlur : ""}>
													<span className="text-white font-medium">
														{user.username}
													</span>
													{user.displayName &&
														user.displayName !== user.username && (
															<span className="text-muted-foreground text-sm ml-2">
																({user.displayName})
															</span>
														)}
												</div>
											</td>
											<td className="p-4">
												{user.email ? (
													<span
														className={`text-muted-foreground text-sm ${isStreamerMode ? streamerBlur : ""}`}
													>
														{user.email}
													</span>
												) : (
													<span className="text-muted-foreground/50 text-sm italic">
														No email
													</span>
												)}
											</td>
											<td className="p-4 text-right">
												<div className="flex items-center justify-end gap-2">
													<Clock className="w-4 h-4 text-muted-foreground" />
													<span className="text-white">
														{user.totalHours.toLocaleString()} hrs
													</span>
												</div>
											</td>
											<td className="p-4 text-right">
												<div className="flex items-center justify-end gap-2">
													<button
														type="button"
														onClick={() => copyLink(user.normalizedId)}
														className="p-2 hover:bg-white/10 rounded-lg transition-colors"
														title="Copy review link"
													>
														{copiedId === user.normalizedId ? (
															<Check className="w-4 h-4 text-green-400" />
														) : (
															<Copy className="w-4 h-4 text-muted-foreground" />
														)}
													</button>
													<button
														type="button"
														onClick={() => openReview(user.normalizedId)}
														className="p-2 hover:bg-white/10 rounded-lg transition-colors"
														title="Open review"
													>
														<ExternalLink className="w-4 h-4 text-muted-foreground" />
													</button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>

				{/* Summary */}
				{users.length > 0 && (
					<div className="glass rounded-2xl p-6 mt-6">
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
							<div>
								<p className="text-2xl font-bold text-white">{users.length}</p>
								<p className="text-sm text-muted-foreground">Total Users</p>
							</div>
							<div>
								<p className="text-2xl font-bold text-jellyfin">
									{users
										.reduce((sum, u) => sum + u.totalHours, 0)
										.toLocaleString()}
								</p>
								<p className="text-sm text-muted-foreground">Total Hours</p>
							</div>
							<div>
								<p className="text-2xl font-bold text-white">
									{users[0]?.totalHours.toLocaleString() || 0}
								</p>
								<p className="text-sm text-muted-foreground">Top Viewer</p>
							</div>
							<div>
								<p className="text-2xl font-bold text-white">
									{(
										users.reduce((sum, u) => sum + u.totalHours, 0) /
										users.length
									).toFixed(1)}
								</p>
								<p className="text-sm text-muted-foreground">Avg Hours</p>
							</div>
						</div>
					</div>
				)}

				{/* Email Section */}
				<div className="glass rounded-2xl p-6 mt-6">
					<div className="flex items-center gap-2 mb-4">
						<Mail className="w-5 h-5 text-jellyfin" />
						<h2 className="text-xl font-semibold text-white">
							Email Notifications
						</h2>
					</div>

					<div className="space-y-4">
						{/* Subject */}
						<div>
							<label
								htmlFor="email-subject"
								className="block text-sm text-muted-foreground mb-2"
							>
								Email Subject
							</label>
							<input
								id="email-subject"
								type="text"
								value={emailSubject}
								onChange={(e) => setEmailSubject(e.target.value)}
								className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-jellyfin"
								placeholder="Email subject..."
							/>
						</div>

						{/* Template */}
						<div>
							<div className="flex items-center justify-between mb-2">
								<label
									htmlFor="email-template"
									className="text-sm text-muted-foreground"
								>
									HTML Template{" "}
									<span className="text-xs opacity-60">
										(email-template.html)
									</span>
								</label>
								<div className="flex items-center gap-2">
									<button
										type="button"
										onClick={loadTemplate}
										disabled={templateLoading}
										className="flex items-center gap-1 text-xs text-muted-foreground hover:text-white transition-colors disabled:opacity-50"
										title="Reload template from file"
									>
										<RefreshCw
											className={`w-3 h-3 ${templateLoading ? "animate-spin" : ""}`}
										/>
										Reload
									</button>
									<button
										type="button"
										onClick={saveTemplate}
										disabled={savingTemplate || templateLoading}
										className="flex items-center gap-1 text-xs text-muted-foreground hover:text-white transition-colors disabled:opacity-50"
										title="Save template to file"
									>
										{savingTemplate ? (
											<Loader2 className="w-3 h-3 animate-spin" />
										) : (
											<Save className="w-3 h-3" />
										)}
										Save
									</button>
									<button
										type="button"
										onClick={() => setShowPreview(!showPreview)}
										className="flex items-center gap-1 text-xs text-muted-foreground hover:text-white transition-colors"
									>
										{showPreview ? (
											<>
												<EyeOff className="w-3 h-3" />
												Hide Preview
											</>
										) : (
											<>
												<Eye className="w-3 h-3" />
												Show Preview
											</>
										)}
									</button>
								</div>
							</div>
							{templateLoading ? (
								<div className="w-full h-[240px] bg-white/10 border border-white/20 rounded-lg flex items-center justify-center">
									<Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
								</div>
							) : (
								<textarea
									id="email-template"
									value={emailTemplate}
									onChange={(e) => setEmailTemplate(e.target.value)}
									rows={10}
									className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-jellyfin"
									placeholder="HTML email template..."
								/>
							)}
							<p className="text-xs text-muted-foreground mt-1">
								Use{" "}
								<code className="bg-white/10 px-1 rounded">
									{"{{REVIEW_LINK}}"}
								</code>{" "}
								for the review link,{" "}
								<code className="bg-white/10 px-1 rounded">{"{{YEAR}}"}</code>{" "}
								for the year, and{" "}
								<code className="bg-white/10 px-1 rounded">{"{{NAME}}"}</code>{" "}
								for the user's first name
							</p>
						</div>

						{/* Preview */}
						{showPreview && (
							<div className="space-y-4">
								{/* HTML Preview */}
								<div className="border border-white/20 rounded-lg overflow-hidden">
									<div className="bg-white/10 px-4 py-2 flex items-center justify-between">
										<span className="text-sm text-muted-foreground">
											HTML Preview
										</span>
										<div className="flex items-center gap-2">
											<button
												type="button"
												onClick={() => setPreviewDarkMode(!previewDarkMode)}
												className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
													previewDarkMode
														? "bg-slate-700 text-white"
														: "bg-amber-100 text-amber-800"
												}`}
												title={
													previewDarkMode
														? "Switch to light mode"
														: "Switch to dark mode"
												}
											>
												{previewDarkMode ? (
													<>
														<Moon className="w-3 h-3" />
														Dark
													</>
												) : (
													<>
														<Sun className="w-3 h-3" />
														Light
													</>
												)}
											</button>
										</div>
									</div>
									<div
										className={previewDarkMode ? "bg-[#1a1a2e]" : "bg-white"}
										style={
											previewDarkMode
												? {
														// Simulate dark mode by injecting dark styles inline
													}
												: {}
										}
										// biome-ignore lint/security/noDangerouslySetInnerHtml: This is an admin-only HTML preview of the email template
										dangerouslySetInnerHTML={{
											__html: (() => {
												const previewLink = APP_URL
													? `${APP_URL}/review/[user-id]?year=${year}`
													: "#";
												const processed = emailTemplate
													.replace(/\{\{REVIEW_LINK\}\}/g, previewLink)
													.replace(/\{\{YEAR\}\}/g, year.toString())
													.replace(/\{\{NAME\}\}/g, "User");
												if (previewDarkMode) {
													return processed
														.replace(
															/background-color:\s*#f5f5f7/g,
															"background-color: #1a1a2e",
														)
														.replace(
															/background-color:\s*#ffffff/g,
															"background-color: #252542",
														)
														.replace(/color:\s*#1a1a2e/g, "color: #ffffff")
														.replace(/color:\s*#4a4a5a/g, "color: #a0a0b0");
												}
												return processed;
											})(),
										}}
									/>
									<div className="bg-white/5 px-4 py-2 border-t border-white/10">
										<p className="text-xs text-muted-foreground">
											⚠️ Dark mode support: ~42% of email clients. Works in Apple
											Mail, iOS Mail, Outlook.com. Gmail &amp; Yahoo don't
											support{" "}
											<code className="bg-white/10 px-1 rounded">
												prefers-color-scheme
											</code>
											.
										</p>
									</div>
								</div>

								{/* Text Preview */}
								<div className="border border-white/20 rounded-lg overflow-hidden">
									<div className="bg-white/10 px-4 py-2 flex items-center justify-between">
										<span className="text-sm text-muted-foreground">
											<FileText className="w-3 h-3 inline mr-1" />
											Plain Text Fallback
										</span>
										<button
											type="button"
											onClick={() => setShowTextPreview(!showTextPreview)}
											className="text-xs text-muted-foreground hover:text-white transition-colors"
										>
											{showTextPreview ? "Hide" : "Show"}
										</button>
									</div>
									{showTextPreview && (
										<div className="bg-gray-900 p-4">
											<pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
												{generatePlainTextEmail(
													year,
													APP_URL ? `${APP_URL}/?year=${year}` : "#",
													"User",
												)}
											</pre>
										</div>
									)}
									{!showTextPreview && (
										<div className="bg-gray-900/50 px-4 py-2">
											<p className="text-xs text-muted-foreground">
												Click "Show" to preview the plain text version sent as
												fallback for email clients that don't support HTML.
											</p>
										</div>
									)}
								</div>
							</div>
						)}

						{/* Test Email */}
						<div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-white/10">
							<div className="flex-1">
								<label
									htmlFor="test-email"
									className="block text-sm text-muted-foreground mb-2"
								>
									Test Email Address
								</label>
								<input
									id="test-email"
									type="email"
									value={testEmail}
									onChange={(e) => setTestEmail(e.target.value)}
									className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-jellyfin"
									placeholder="your@email.com"
								/>
							</div>
							<div className="flex items-end">
								<button
									type="button"
									onClick={sendTestEmail}
									disabled={sendingEmail || !testEmail}
									className="flex items-center gap-2 px-6 py-2 bg-jellyfin hover:bg-jellyfin/80 disabled:bg-jellyfin/50 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
								>
									{sendingEmail ? (
										<Loader2 className="w-4 h-4 animate-spin" />
									) : (
										<Send className="w-4 h-4" />
									)}
									Send Test
								</button>
							</div>
						</div>

						{/* Status message */}
						{emailStatus && (
							<div
								className={`p-3 rounded-lg text-sm ${
									emailStatus.type === "success"
										? "bg-green-500/20 text-green-400 border border-green-500/30"
										: "bg-red-500/20 text-red-400 border border-red-500/30"
								}`}
							>
								{emailStatus.message}
							</div>
						)}

						{/* Send to all users */}
						<div className="p-4 bg-white/5 rounded-lg border border-white/10 space-y-3">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm text-white font-medium">
										Send to All Users
									</p>
									<p className="text-xs text-muted-foreground">
										{usersWithEmail.length} of {users.length} users have email
										addresses
									</p>
								</div>
								<button
									type="button"
									onClick={sendToAllUsers}
									disabled={
										sendingToAll ||
										usersWithEmail.length === 0 ||
										templateLoading
									}
									className="flex items-center gap-2 px-4 py-2 bg-jellyfin hover:bg-jellyfin/80 disabled:bg-jellyfin/50 disabled:cursor-not-allowed rounded-lg text-white text-sm transition-colors"
								>
									{sendingToAll ? (
										<Loader2 className="w-4 h-4 animate-spin" />
									) : (
										<Send className="w-4 h-4" />
									)}
									Send to {usersWithEmail.length} Users
								</button>
							</div>
							{bulkSendProgress && (
								<div className="space-y-2">
									<div className="w-full bg-white/10 rounded-full h-2">
										<div
											className="bg-jellyfin h-2 rounded-full transition-all"
											style={{
												width: `${((bulkSendProgress.sent + bulkSendProgress.failed) / bulkSendProgress.total) * 100}%`,
											}}
										/>
									</div>
									<p className="text-xs text-muted-foreground">
										Sent: {bulkSendProgress.sent} | Failed:{" "}
										{bulkSendProgress.failed} | Total: {bulkSendProgress.total}
									</p>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
