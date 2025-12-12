import { redirect } from "next/navigation";
import { LoginView } from "@/components/auth/LoginView";
import { getSession } from "@/lib/auth";

export default async function LoginPage() {
	// If already logged in, redirect to home
	const session = await getSession();
	if (session?.user) {
		redirect("/");
	}

	return <LoginView />;
}
