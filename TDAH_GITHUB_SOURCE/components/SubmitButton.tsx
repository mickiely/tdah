"use client";

import { useFormStatus } from "react-dom";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export function SubmitButton({
  children,
  pendingLabel,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`${className ?? ""} transition-opacity disabled:cursor-wait disabled:opacity-60`}
      {...props}
    >
      {pendingLabel ? (
        <span className="relative inline-flex items-center justify-center">
          <span className={pending ? "invisible" : ""}>{children}</span>
          {pending && (
            <span className="absolute inset-0 flex items-center justify-center">
              {pendingLabel}
            </span>
          )}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
