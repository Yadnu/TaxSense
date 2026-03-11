import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import type { User } from "@prisma/client";

/**
 * Returns the current Clerk userId or null.
 * Safe to call from server components and API routes.
 */
export async function getAuthUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

/**
 * Returns the current Clerk userId, redirecting to /sign-in if not authenticated.
 * Use in server components that require authentication.
 */
export async function requireAuthUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }
  return userId;
}

/**
 * Returns the TaxSense DB user record for the currently authenticated Clerk user.
 * Creates the record if it doesn't exist yet (upsert on first use).
 * Redirects to /sign-in if unauthenticated.
 */
export async function getCurrentUser(): Promise<User> {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect("/sign-in");
  }

  const email =
    clerkUser.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId
    )?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;

  if (!email) {
    throw new Error("Clerk user has no email address");
  }

  const user = await prisma.user.upsert({
    where: { clerkId: clerkUser.id },
    update: {
      email,
      firstName: clerkUser.firstName ?? undefined,
      lastName: clerkUser.lastName ?? undefined,
      imageUrl: clerkUser.imageUrl ?? undefined,
    },
    create: {
      clerkId: clerkUser.id,
      email,
      firstName: clerkUser.firstName ?? undefined,
      lastName: clerkUser.lastName ?? undefined,
      imageUrl: clerkUser.imageUrl ?? undefined,
    },
  });

  return user;
}

/**
 * Looks up a TaxSense DB user by Clerk user ID without redirecting.
 * Returns null if not found.
 */
export async function getUserByClerkId(
  clerkId: string
): Promise<User | null> {
  return prisma.user.findUnique({ where: { clerkId } });
}

/**
 * Records an action in the audit log for the given user.
 */
export async function recordAuditLog(params: {
  userId: string;
  action: string;
  resource?: string;
  resourceId?: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  await prisma.auditLog.create({ data: params });
}
