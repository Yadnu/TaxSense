"use client";

import { UserProfile } from "@clerk/nextjs";

export default function SettingsPage() {
  return (
    <div className="flex flex-col">

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="page-header">
        <h1 className="text-lg font-semibold text-foreground">Settings</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Manage your account and preferences.
        </p>
      </div>

      <div className="p-6">
        <UserProfile
          appearance={{
            elements: {
              rootBox:           "w-full",
              card:              "shadow-none border border-border rounded-xl w-full bg-card",
              headerTitle:       "text-foreground",
              headerSubtitle:    "text-muted-foreground",
              profileSectionTitle: "text-foreground",
              formFieldLabel:    "text-foreground",
              formFieldInput:    "bg-background border-border text-foreground",
              navbarButton:      "text-muted-foreground hover:text-foreground",
              navbarButtonActive:"text-foreground",
              dividerLine:       "bg-border",
              badge:             "bg-muted text-muted-foreground",
            },
          }}
        />
      </div>

    </div>
  );
}
