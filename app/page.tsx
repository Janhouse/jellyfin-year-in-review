import { redirect } from "next/navigation";
import { NotLinkedView } from "@/components/auth/NotLinkedView";
import { getJellyfinUsername, getSession } from "@/lib/auth";
import { getUserByUsername } from "@/lib/services";

export default async function Home() {
	// Check if user is authenticated
	const session = await getSession();

	// Not logged in - redirect to login
	if (!session?.user) {
		redirect("/login");
	}

	// Get the jellyfin username from the session
	const jellyfinUsername = await getJellyfinUsername();

	// If no jellyfin username linked, show not linked view
	if (!jellyfinUsername) {
		return <NotLinkedView userName={session.user.name || "User"} />;
	}

	// Look up the Jellyfin user by username
	const jellyfinUser = getUserByUsername(jellyfinUsername);

	// If no matching Jellyfin user found, show not linked view
	if (!jellyfinUser) {
		return (
			<NotLinkedView
				userName={session.user.name || "User"}
				jellyfinUsername={jellyfinUsername}
			/>
		);
	}

	// Redirect to the user's review page
	redirect(`/review/${jellyfinUser.id}`);
}
