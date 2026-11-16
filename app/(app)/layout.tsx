export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="no-print"><Sidebar user={session.user as any} /></div>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
