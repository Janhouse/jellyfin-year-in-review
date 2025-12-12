"use client";

import { useRouter } from "next/navigation";

interface YearSelectorProps {
	currentYear: number;
	availableYears: number[];
	userId?: string;
	onYearChange?: (year: number) => void;
}

export function YearSelector({
	currentYear,
	availableYears,
	userId,
	onYearChange,
}: YearSelectorProps) {
	const router = useRouter();

	const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const newYear = Number.parseInt(e.target.value, 10);
		if (onYearChange) {
			onYearChange(newYear);
		} else if (userId) {
			router.push(`/review/${userId}?year=${newYear}`);
		}
	};

	return (
		<select
			value={currentYear}
			onChange={handleChange}
			className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-jellyfin transition-all cursor-pointer"
		>
			{availableYears.map((year) => (
				<option key={year} value={year} className="bg-neutral-900">
					{year}
				</option>
			))}
		</select>
	);
}
