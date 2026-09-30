import { signOut } from "@/app/actions";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="text-sm font-medium text-[var(--muted)] underline decoration-dotted"
      >
        Sign out
      </button>
    </form>
  );
}
