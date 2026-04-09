"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const UserButtonClient = dynamic(
  () => import("@clerk/nextjs").then((mod) => mod.UserButton),
  {
    ssr: false,
    loading: () => (
      <div className="h-7 w-7 shrink-0 rounded-full bg-muted" aria-hidden />
    ),
  }
);

type Props = ComponentProps<
  typeof import("@clerk/nextjs").UserButton
>;

/** Avoids Clerk UserButton SSR/client DOM mismatch (hydration errors). */
export function ClerkUserButton(props: Props) {
  return <UserButtonClient {...props} />;
}
