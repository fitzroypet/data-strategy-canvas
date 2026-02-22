import Link from "next/link";

export function DashboardLink() {
  return (
    <Link
      href="/dashboard"
      className="h-9 rounded-full border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 hover:border-zinc-300"
    >
      Dashboard
    </Link>
  );
}

