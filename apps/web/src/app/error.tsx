"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Something went wrong
      </h2>
      {error.message ? (
        <p className="max-w-md text-center text-sm text-zinc-600 dark:text-zinc-400">
          {error.message}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-zinc-50 transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        Try again
      </button>
    </div>
  );
}