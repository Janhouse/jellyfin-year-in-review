import { Database } from "bun:sqlite";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { CronJob } from "cron";

// Database paths - can be overridden with DB_DIR environment variable
const DB_DIR = process.env.DB_DIR || path.join(process.cwd(), "db");
const JELLYFIN_DB = path.join(DB_DIR, "jellyfin.db");
const PLAYBACK_DB = path.join(DB_DIR, "playback_reporting.db");

// Set DB_COPY=true to copy databases to temp dir before opening (for read-only mounts)
const DB_COPY = process.env.DB_COPY === "true";
// Cron schedule for refresh (default: every 3 hours at minute 0)
// Set DB_REFRESH_CRON="" to disable periodic refresh
const DB_REFRESH_CRON = process.env.DB_REFRESH_CRON ?? "0 */3 * * *";

const TEMP_DB_DIR = path.join(tmpdir(), "jellyfin-year-in-review");

// Singleton database connections
let jellyfinDb: Database | null = null;
let playbackDb: Database | null = null;
let refreshJob: CronJob | null = null;
let initialized = false;

/**
 * Copy a single database file to temp directory
 */
function copyDbFile(srcPath: string, destPath: string): void {
	console.log(`[DB] Copying ${srcPath} -> ${destPath}`);
	copyFileSync(srcPath, destPath);

	// Also copy WAL and SHM files if they exist
	for (const ext of ["-wal", "-shm"]) {
		const srcExt = `${srcPath}${ext}`;
		if (existsSync(srcExt)) {
			console.log(`[DB] Copying ${ext.slice(1).toUpperCase()} file: ${srcExt}`);
			copyFileSync(srcExt, `${destPath}${ext}`);
		}
	}
}

/**
 * Copy all database files to temp directory
 */
function copyAllDatabases(): void {
	if (!existsSync(TEMP_DB_DIR)) {
		console.log(`[DB] Creating temp directory: ${TEMP_DB_DIR}`);
		mkdirSync(TEMP_DB_DIR, { recursive: true });
	}

	copyDbFile(JELLYFIN_DB, path.join(TEMP_DB_DIR, "jellyfin.db"));
	copyDbFile(PLAYBACK_DB, path.join(TEMP_DB_DIR, "playback_reporting.db"));
}

/**
 * Refresh database copies from source (closes existing connections)
 * Called by cron when DB_COPY=true
 */
export function refreshDatabases(): void {
	if (!DB_COPY) return;

	console.log("[DB] Refreshing database copies...");

	// Close existing connections
	if (jellyfinDb) {
		jellyfinDb.close();
		jellyfinDb = null;
	}
	if (playbackDb) {
		playbackDb.close();
		playbackDb = null;
	}

	// Copy fresh databases
	copyAllDatabases();

	console.log("[DB] Database copies refreshed");
}

/**
 * Initialize database system - call once at app startup
 * Sets up cron job for periodic refresh if DB_COPY is enabled
 */
export function initializeDatabases(): void {
	if (initialized) return;
	initialized = true;

	if (DB_COPY) {
		console.log("[DB] DB_COPY enabled, using temp directory for databases");
		console.log(`[DB] Source directory: ${DB_DIR}`);
		console.log(`[DB] Temp directory: ${TEMP_DB_DIR}`);

		// Initial copy
		copyAllDatabases();

		// Set up cron job for periodic refresh
		if (DB_REFRESH_CRON) {
			console.log(`[DB] Setting up refresh cron: ${DB_REFRESH_CRON}`);
			refreshJob = new CronJob(DB_REFRESH_CRON, refreshDatabases);
			refreshJob.start();
		} else {
			console.log("[DB] Periodic refresh disabled (DB_REFRESH_CRON not set)");
		}
	} else {
		console.log(`[DB] Using database directory: ${DB_DIR}`);
	}
}

/**
 * Get the Jellyfin database connection (read-only)
 */
export function getJellyfinDb(): Database {
	if (!initialized) initializeDatabases();

	if (!jellyfinDb) {
		const dbPath = DB_COPY
			? path.join(TEMP_DB_DIR, "jellyfin.db")
			: JELLYFIN_DB;
		console.log(`[DB] Opening Jellyfin database: ${dbPath}`);
		jellyfinDb = new Database(dbPath, { readonly: true });
	}
	return jellyfinDb;
}

/**
 * Get the Playback reporting database connection (read-only)
 */
export function getPlaybackDb(): Database {
	if (!initialized) initializeDatabases();

	if (!playbackDb) {
		const dbPath = DB_COPY
			? path.join(TEMP_DB_DIR, "playback_reporting.db")
			: PLAYBACK_DB;
		console.log(`[DB] Opening Playback database: ${dbPath}`);
		playbackDb = new Database(dbPath, { readonly: true });
	}
	return playbackDb;
}

/**
 * Close all database connections
 */
export function closeConnections(): void {
	jellyfinDb?.close();
	playbackDb?.close();
	jellyfinDb = null;
	playbackDb = null;
}

// Close connections on process exit
process.on("exit", closeConnections);
