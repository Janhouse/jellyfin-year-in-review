import { redirect } from "next/navigation";
import { AdminUsersView } from "@/components/admin/AdminUsersView";
import { isAdmin } from "@/lib/auth";
import {
	getServerAvailableYears,
	getUsersWithHoursAndEmail,
} from "@/lib/services";

interface PageProps {
	searchParams: Promise<{ year?: string; minHours?: string }>;
}

export default async function AdminPage({ searchParams }: PageProps) {
	// Only admins can access this page
	const adminAccess = await isAdmin();
	if (!adminAccess) {
		redirect("/");
	}

	const { year: yearParam, minHours: minHoursParam } = await searchParams;

	const availableYears = getServerAvailableYears();
	if (availableYears.length === 0) {
		return (
			<div className="min-h-screen gradient-mesh flex items-center justify-center p-4">
				<div className="glass rounded-2xl p-8 max-w-md text-center">
					<h1 className="text-2xl font-bold text-white mb-4">No Data Found</h1>
					<p className="text-muted-foreground">
						No playback activity has been recorded yet.
					</p>
				</div>
			</div>
		);
	}

	// Default to most recent year
	const year = yearParam ? Number.parseInt(yearParam, 10) : availableYears[0];
	const minHours = minHoursParam ? Number.parseFloat(minHoursParam) : 10;

	if (!availableYears.includes(year)) {
		redirect(`/admin?year=${availableYears[0]}&minHours=${minHours}`);
	}

	const users = await getUsersWithHoursAndEmail(year, minHours);

	return (
		<AdminUsersView
			year={year}
			availableYears={availableYears}
			minHours={minHours}
			users={users}
		/>
	);
}
