import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { redirect } from "next/navigation";
import EventForm from "@/components/admin/EventForm";

export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") redirect("/login");

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: "2rem" }}>
        <div className="section-label">Admin › Events</div>
        <h1 className="section-title" style={{ fontSize: "1.75rem", margin: 0 }}>Create New Event</h1>
      </div>
      <EventForm mode="create" />
    </div>
  );
}
