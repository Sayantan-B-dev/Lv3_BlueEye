import type { Metadata } from "next";
import EventsListView from "@/components/events/EventsListView";
import { getGlobalEventsLock } from "@/lib/services/eventLockService";
import { siteConfig } from "@/lib/config/site";
import { pageMetadata } from "@/lib/seo/metadata";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const lock = await getGlobalEventsLock();
  return pageMetadata({
    title: "Events & Live Shows",
    description: `Browse upcoming live events, concerts, and shows managed by ${siteConfig.name}.`,
    path: "/events",
    noIndex: lock.locked,
  });
}

export default function EventsPage() {
  return <EventsListView />;
}
