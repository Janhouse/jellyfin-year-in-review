import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";

interface SendEmailRequest {
	to: string;
	subject: string;
	html: string;
	text?: string;
}

export async function POST(request: Request) {
	// Check admin access
	const adminAccess = await isAdmin();
	if (!adminAccess) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = (await request.json()) as SendEmailRequest;
		const { to, subject, html, text } = body;

		if (!to || !subject || !html) {
			return NextResponse.json(
				{ error: "Missing required fields: to, subject, html" },
				{ status: 400 },
			);
		}

		// Validate email format - supports both "email@domain.ext" and "Name <email@domain.ext>"
		const simpleEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		const namedEmailRegex = /^.+\s*<[^\s@]+@[^\s@]+\.[^\s@]+>$/;
		if (!simpleEmailRegex.test(to) && !namedEmailRegex.test(to)) {
			console.error("Invalid email address format:", to);
			return NextResponse.json(
				{ error: `Invalid email address format: ${to}` },
				{ status: 400 },
			);
		}

		// Send email using SMTP
		const smtpHost = process.env.SMTP_HOST;
		const smtpPort = process.env.SMTP_PORT || "587";
		const smtpUser = process.env.SMTP_USER;
		const smtpPassword = process.env.SMTP_PASSWORD;
		const smtpFrom = process.env.SMTP_FROM;
		const smtpReplyTo = process.env.SMTP_REPLY_TO;

		if (!smtpHost || !smtpFrom) {
			return NextResponse.json(
				{
					error:
						"SMTP configuration is incomplete (SMTP_HOST and SMTP_FROM are required)",
				},
				{ status: 500 },
			);
		}

		// Use nodemailer for sending emails
		const nodemailer = await import("nodemailer");

		const transporter = nodemailer.createTransport({
			host: smtpHost,
			port: Number.parseInt(smtpPort, 10),
			secure: smtpPort === "465",
			// Only include auth if credentials are provided
			...(smtpUser &&
				smtpPassword && {
					auth: {
						user: smtpUser,
						pass: smtpPassword,
					},
				}),
		});

		await transporter.sendMail({
			from: smtpFrom,
			to,
			subject,
			html,
			...(text && { text }),
			...(smtpReplyTo && { replyTo: smtpReplyTo }),
		});

		return NextResponse.json({ success: true, message: `Email sent to ${to}` });
	} catch (error) {
		console.error("Failed to send email:", error);
		return NextResponse.json(
			{
				error: `Failed to send email: ${error instanceof Error ? error.message : "Unknown error"}`,
			},
			{ status: 500 },
		);
	}
}
