import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Page not found
      </h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        The page you are looking for does not exist.
      </p>
      <Link
        href="/"
        className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-zinc-50 transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        Go home
      </Link>
    </div>
  );
}