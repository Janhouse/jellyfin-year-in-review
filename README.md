# Jellyfin Year in Review

A beautiful, personalized "Year in Review" dashboard for Jellyfin media server users - similar to Spotify Wrapped but for your movie and TV show watching habits.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Bun](https://img.shields.io/badge/Bun-1.x-f9f1e1?logo=bun)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)
![License](https://img.shields.io/badge/license-AGPL--3.0-blue)

## Features

### Personal Statistics
- **Watch Time**: Total hours/days watched, broken down by movies vs TV shows
- **Top Content**: Most-watched movies and TV shows with poster art from TMDB
- **Abandoned Movies**: Movies you started but didn't finish (with completion percentage)
- **Genre Analysis**: Your top genres across all content

### Viewing Patterns
- **Hourly Distribution**: When you watch most (with timezone support)
- **Day of Week**: Your peak watching days
- **Monthly Trends**: How your watching varies throughout the year
- **Device & Client Stats**: Which devices and apps you use most
- **Playback Methods**: Direct Play vs Transcoding breakdown

### Advanced Features
- **Marathon Detection**: Identifies your longest continuous watching sessions
- **Personality Types**: 14 different "viewer personalities" based on your habits
  - Night Owl, Early Bird, Weekend Warrior, Binge Watcher, and more
- **User Ranking**: See how you compare to other users on your server
- **Multi-Year Support**: Switch between different years of data

### Admin Features
- **User Management**: View all users with their watch statistics
- **Email Notifications**: Send personalized Year in Review emails to users
- **Customizable Email Template**: HTML email editor with preview

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Jellyfin     │     │    Authentik    │     │      TMDB       │
│   (SQLite DBs)  │     │   (SSO/OIDC)    │     │   (Metadata)    │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │ read-only             │ OAuth                 │ REST API
         │                       │                       │
         └───────────────┬───────┴───────────────────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │  Jellyfin Year in   │
              │       Review        │
              │  (Next.js + Bun)    │
              └─────────────────────┘
                         │
           ┌─────────────┴─────────────┐
           │                           │
           ▼                           ▼
    ┌─────────────┐           ┌─────────────────┐
    │    Users    │           │  Admin Panel    │
    │  (Reviews)  │           │ (Email/Manage)  │
    └─────────────┘           └─────────────────┘
```

## System Requirements

- **Runtime**: [Bun](https://bun.sh/) 1.x
- **Node.js**: 18+ (if not using Bun)
- **Jellyfin**: With Playback Reporting plugin
- **Authentik**: For SSO authentication (or other OIDC provider with modifications)
- **TMDB API Key**: For movie/show metadata and posters

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/jellyfin-year-in-review.git
cd jellyfin-year-in-review
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Configure Environment

Create a `.env.local` file:

```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

### 4. Set Up Database Access

Copy or mount the Jellyfin databases to the `./db` directory:

```bash
mkdir -p db
# Copy databases (or mount read-only in Docker)
cp /path/to/jellyfin/data/jellyfin.db ./db/
cp /path/to/jellyfin/data/playback_reporting.db ./db/
```

### 5. Run Development Server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Configuration

### Environment Variables

#### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `BETTER_AUTH_SECRET` | Secret key for JWT signing (generate with `openssl rand -hex 32`) | `abc123...` |
| `BETTER_AUTH_URL` | Base URL for authentication | `http://localhost:3000` |
| `AUTHENTIK_CLIENT_ID` | OAuth client ID from Authentik | `jellyfin-review` |
| `AUTHENTIK_CLIENT_SECRET` | OAuth client secret from Authentik | `secret123` |
| `AUTH_AUTHENTIK_ISSUER` | Authentik OpenID issuer URL | `https://auth.example.com/application/o/jellyfin-review/` |
| `TMDB_API_KEY` | The Movie Database API key ([get one here](https://www.themoviedb.org/settings/api)) | `abc123...` |

#### Authentik Integration

| Variable | Description | Default |
|----------|-------------|---------|
| `AUTHENTIK_URL` | Authentik base URL for API calls | - |
| `AUTHENTIK_API_TOKEN` | Authentik API token for user lookups | - |
| `AUTHENTIK_JELLYFIN_GROUP` | Authentik group containing Jellyfin users | `Jellyfin` |
| `AUTHENTIK_JELLYFIN_USERNAME_ATTRIBUTE` | User attribute for Jellyfin username | `jellyfin_username` |
| `AUTHENTIK_JELLYFIN_TIMEZONE_ATTRIBUTE` | User attribute for timezone | `jellyfin_timezone` |

#### Public URLs (Client-Side)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | Application base URL | `https://review.example.com` |
| `NEXT_PUBLIC_JELLYFIN_URL` | Jellyfin server URL (for item links) | `https://jellyfin.example.com` |
| `NEXT_PUBLIC_JELLYFIN_SERVER_ID` | Jellyfin server ID (for deep links) | `9d0d09...` |
| `NEXT_PUBLIC_SEER_URL` | Overseerr/Jellyseerr URL (for request links) | `https://seer.example.com` |

#### Database

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_DIR` | Directory containing Jellyfin databases | `./db` |
| `DB_COPY` | Copy databases to temp dir (for read-only mounts) | `false` |
| `DB_REFRESH_CRON` | Cron schedule for database refresh | `0 */3 * * *` |

#### Timezone

| Variable | Description | Default |
|----------|-------------|---------|
| `TIMEZONE` | Default timezone for statistics | `Europe/Riga` |
| `TZ` | System timezone | - |

#### Email (SMTP)

| Variable | Description | Default |
|----------|-------------|---------|
| `SMTP_HOST` | SMTP server hostname | - |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP authentication username | - |
| `SMTP_PASSWORD` | SMTP authentication password | - |
| `SMTP_FROM` | Sender email address | - |
| `SMTP_REPLY_TO` | Reply-to email address | - |

#### Analytics (Optional)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | Umami analytics website ID | `abc123...` |
| `NEXT_PUBLIC_UMAMI_SRC` | Umami script URL | `https://umami.example.com/script.js` |

### Authentik Setup

1. **Create an OAuth2/OIDC Application** in Authentik:
   - Name: `Jellyfin Year in Review`
   - Client type: Confidential
   - Redirect URIs: `https://your-app.com/api/auth/callback/authentik`

2. **Create a Custom Scope** named `jellyfin`:
   ```
   Expression:
   return {
     "jellyfin_username": request.user.attributes.get("jellyfin_username", ""),
     "jellyfin_timezone": request.user.attributes.get("jellyfin_timezone", ""),
   }
   ```

3. **Add User Attributes**:
   - `jellyfin_username`: The user's Jellyfin username
   - `jellyfin_timezone`: The user's timezone (e.g., `Europe/London`, `America/New_York`)

4. **Create an Admin Group** (optional):
   - Create a group named `admin` in Authentik
   - Users in this group can view any user's review and access the admin panel

5. **Create an API Token** for user lookups:
   - Go to Directory > Tokens and App passwords
   - Create a new token with appropriate permissions

## Database Requirements

This application reads from two Jellyfin SQLite databases:

### jellyfin.db
Contains user and media item information:
- User accounts (IDs, usernames)
- Media items (movies, episodes, series)
- Provider mappings (TMDB IDs)
- Runtime and genre information

### playback_reporting.db
Created by the [Playback Reporting plugin](https://github.com/jellyfin/jellyfin-plugin-playback-reporting):
- Playback activity events
- Watch duration tracking
- Device and client information

**Important**: Databases are accessed in read-only mode. The application never modifies Jellyfin data.

## Docker Deployment

### Using Docker Compose

```yaml
services:
  jellyfin-year-in-review:
    image: your-registry/jellyfin-year-in-review:latest
    build:
      dockerfile: ./Dockerfile
    restart: unless-stopped
    env_file:
      - .env.local
    environment:
      - NEXT_PUBLIC_APP_URL=https://review.example.com
      - NEXT_PUBLIC_JELLYFIN_URL=https://jellyfin.example.com
      - TIMEZONE=Europe/London
      - TZ=Europe/London
    volumes:
      - /path/to/jellyfin/data:/db:ro
    ports:
      - "3000:3000"
```

### Building the Image

```bash
docker build -t jellyfin-year-in-review .
```

### Running Standalone

```bash
docker run -d \
  --name jellyfin-year-in-review \
  -p 3000:3000 \
  -v /path/to/jellyfin/data:/db:ro \
  --env-file .env.local \
  jellyfin-year-in-review
```

### Read-Only Database Mounts

If mounting databases as read-only (`:ro`), the SQLite driver may have issues with WAL mode. Enable database copying:

```bash
DB_COPY=true
DB_REFRESH_CRON="0 */3 * * *"  # Refresh every 3 hours
```

This copies the databases to a temporary directory on startup and refreshes them periodically.

## Development

### Scripts

```bash
# Development server with hot reload
bun dev

# Type checking
bun run typecheck

# Linting
bun run lint

# Auto-fix linting issues
bun run lint:fix

# Format code
bun run format

# Production build
bun run build

# Start production server
bun start
```

### Project Structure

```
jellyfin-year-in-review/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin dashboard
│   ├── api/               # API routes
│   ├── login/             # Login page
│   ├── review/[userId]/   # User review page
│   └── stats/             # Server statistics
├── components/            # React components
│   ├── admin/            # Admin-specific components
│   ├── auth/             # Authentication components
│   ├── review/           # Review page components
│   └── ui/               # Shared UI components
├── lib/                   # Business logic
│   ├── dao/              # Data access layer
│   ├── db/               # Database connection
│   ├── helpers/          # Utility functions
│   ├── services/         # Business services
│   └── types/            # TypeScript types
├── db/                    # Database files (gitignored)
├── public/               # Static assets
└── email-template.html   # Email notification template
```

### Key Technologies

- **Framework**: Next.js 16 with App Router
- **Runtime**: Bun (with SQLite support)
- **Language**: TypeScript 5.9
- **Styling**: Tailwind CSS 4
- **Animation**: Framer Motion
- **Authentication**: better-auth with OIDC
- **Database**: SQLite (Bun's built-in driver)
- **UI Components**: Radix UI primitives

## How It Works

### Session Merging
Jellyfin logs multiple events per viewing session (start, progress, completion). This application merges these events into coherent "sessions" with accurate watch duration.

### Marathon Detection
Consecutive viewing sessions with less than 45 minutes between them are grouped into "marathons". This identifies binge-watching behavior.

### Personality Algorithm
Your viewing personality is determined by analyzing:
- Peak watching hours (night owl vs early bird)
- Weekend vs weekday viewing ratios
- Late night viewing frequency
- Content type preferences (movies vs episodes)
- Marathon duration records

### Timezone Handling
Statistics are calculated with timezone awareness:
1. User's timezone from SSO (if configured)
2. Fall back to `TIMEZONE` environment variable
3. Default to `Europe/Riga`

This ensures "Peak viewing hour" shows correctly regardless of server timezone.

## Troubleshooting

### "No Data Found" for a User
- Verify the user has the Playback Reporting plugin logging activity
- Check that `jellyfin_username` in Authentik matches the Jellyfin username exactly
- Ensure the databases are accessible and up-to-date

### Wrong Timezone in Statistics
- Set the `TIMEZONE` environment variable
- Configure `jellyfin_timezone` attribute in Authentik for per-user timezones
- Note: System timezone (`TZ`) affects database copying, not statistics

### TMDB Posters Not Loading
- Verify your `TMDB_API_KEY` is valid
- Check that items have TMDB IDs in Jellyfin's metadata
- The app falls back to search by title if no TMDB ID exists

### SSO Login Issues
- Verify Authentik OAuth configuration
- Check redirect URI matches exactly
- Ensure the `jellyfin` scope is configured and assigned

### Database Access Errors
- For read-only mounts, enable `DB_COPY=true`
- Check file permissions on the database directory
- Ensure databases are not corrupted (Jellyfin should be stopped during copy)

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0) - see the [LICENSE](LICENSE) file for details.

This means if you modify and deploy this software as a network service, you must make the source code available to users of that service.

## Acknowledgments

- [Jellyfin](https://jellyfin.org/) - The free software media system
- [Playback Reporting Plugin](https://github.com/jellyfin/jellyfin-plugin-playback-reporting) - For activity tracking
- [TMDB](https://www.themoviedb.org/) - For movie and TV metadata
- [Authentik](https://goauthentik.io/) - For SSO authentication
- [better-auth](https://www.better-auth.com/) - For the authentication framework
