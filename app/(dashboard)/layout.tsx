import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app/app-sidebar";
import { COOKIE_NAME } from "@/lib/server";

// export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await cookies()).get(COOKIE_NAME)) redirect("/login");
  return (
    <div className="min-h-screen">
      <AppSidebar />
      <main className="lg:pl-60">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
