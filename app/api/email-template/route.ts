import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";

const TEMPLATE_PATH = join(process.cwd(), "email-template.html");

export async function GET() {
	// Check admin access
	const adminAccess = await isAdmin();
	if (!adminAccess) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const template = await readFile(TEMPLATE_PATH, "utf-8");
		return NextResponse.json({ template });
	} catch (error) {
		console.error("Failed to read email template:", error);
		return NextResponse.json(
			{ error: "Failed to read email template" },
			{ status: 500 },
		);
	}
}

export async function PUT(request: Request) {
	// Check admin access
	const adminAccess = await isAdmin();
	if (!adminAccess) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { template } = body;

		if (!template || typeof template !== "string") {
			return NextResponse.json(
				{ error: "Missing or invalid template" },
				{ status: 400 },
			);
		}

		await writeFile(TEMPLATE_PATH, template, "utf-8");
		return NextResponse.json({ success: true, message: "Template saved" });
	} catch (error) {
		console.error("Failed to save email template:", error);
		return NextResponse.json(
			{ error: "Failed to save email template" },
			{ status: 500 },
		);
	}
}
