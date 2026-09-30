import Link from "next/link";
import { signIn } from "@/app/actions";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Sign in to pick up your momentum.
        </p>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <form action={signIn} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Email
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base outline-none focus:border-[var(--accent)]"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium">
            Password
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base outline-none focus:border-[var(--accent)]"
            />
          </label>

          <button
            type="submit"
            className="mt-2 rounded-lg bg-[var(--accent)] px-4 py-3 text-base font-semibold text-[var(--accent-foreground)] transition active:scale-[0.98]"
          >
            Sign in
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          New here?{" "}
          <Link href="/sign-up" className="font-medium text-[var(--accent)] underline">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
