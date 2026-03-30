import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getSessionPayload } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export default async function DashboardProfilePage() {
  const session = await getSessionPayload();

  if (!session?.sid) {
    redirect("/login");
  }

  if (session.role !== "personnel" && session.role !== "admin") {
    redirect("/");
  }

  let profileData: {
    role: "personnel" | "admin";
    username?: string;
    name?: string;
    email?: string;
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  } | null = null;

  if (session.role === "personnel" && session.personnelId) {
    const personnel = await prisma.personnel.findUnique({
      where: { personnelId: session.personnelId },
      select: {
        username: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!personnel) {
      redirect("/dashboard");
    }

    profileData = {
      role: "personnel",
      ...personnel,
    };
  } else if (session.role === "admin" && session.adminId) {
    const admin = await prisma.admin.findUnique({
      where: { adminId: session.adminId },
      select: {
        username: true,
        createdAt: true,
      },
    });

    if (!admin) {
      redirect("/dashboard");
    }

    profileData = {
      role: "admin",
      username: admin.username,
      createdAt: admin.createdAt,
    };
  }

  if (!profileData) {
    redirect("/dashboard");
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-text-default transition-colors duration-150 hover:bg-surface-soft"
        >
          <ChevronLeft size={16} />
          Back
        </Link>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-8">
        {/* Header Section */}
        <div className="mb-8 flex items-center justify-between border-b border-border pb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-default">
              {profileData.name || profileData.username || "Profile"}
            </h1>
            <p className="text-sm text-text-muted capitalize">
              {profileData.role} Account
            </p>
          </div>
          {profileData.role === "personnel" && (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-soft px-4 py-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  profileData.isActive ? "bg-success" : "bg-error"
                }`}
              />
              <span className="text-sm font-medium text-text-default">
                {profileData.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          )}
        </div>

        {/* Main Content - 2 Column Grid */}
        <div className="grid grid-cols-2 gap-6 md:gap-8">
          {/* Left Column */}
          <div className="space-y-5">
            {/* Username */}
            {profileData.username ? (
              <div>
                <label className="block text-xs font-semibold uppercase text-text-muted mb-2">
                  Username
                </label>
                <div className="rounded-lg border border-border bg-surface-soft px-4 py-3">
                  <span className="text-sm font-medium text-text-default">
                    {profileData.username}
                  </span>
                </div>
              </div>
            ) : null}

            {/* Created At */}
            {profileData.createdAt ? (
              <div>
                <label className="block text-xs font-semibold uppercase text-text-muted mb-2">
                  Created At
                </label>
                <div className="rounded-lg border border-border bg-surface-soft px-4 py-3">
                  <span className="text-sm font-medium text-text-default">
                    {new Date(profileData.createdAt).toLocaleDateString()}
                  </span>
                  <p className="text-xs text-text-muted">
                    {new Date(profileData.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          {/* Right Column */}
          <div className="space-y-5">
            {/* Full Name & Email */}
            {profileData.name ? (
              <div>
                <label className="block text-xs font-semibold uppercase text-text-muted mb-2">
                  Full Name
                </label>
                <div className="rounded-lg border border-border bg-surface-soft px-4 py-3">
                  <span className="text-sm font-medium text-text-default">
                    {profileData.name}
                  </span>
                </div>
              </div>
            ) : null}

            {profileData.email ? (
              <div>
                <label className="block text-xs font-semibold uppercase text-text-muted mb-2">
                  Email
                </label>
                <div className="rounded-lg border border-border bg-surface-soft px-4 py-3">
                  <span className="text-sm font-medium text-text-default">
                    {profileData.email}
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer Section - Timestamps */}
        {profileData.updatedAt ? (
          <div className="mt-8 border-t border-border pt-4">
            <p className="text-xs text-text-muted">
              Last updated on{" "}
              <span className="font-medium">
                {new Date(profileData.updatedAt).toLocaleString()}
              </span>
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
