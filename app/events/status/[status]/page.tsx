import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EventsListView from "@/components/events/EventsListView";
import { getGlobalEventsLock } from "@/lib/services/eventLockService";
import { siteConfig } from "@/lib/config/site";
import { pageMetadata } from "@/lib/seo/metadata";
import { eventStatusPath } from "@/lib/seo/slugs";
import { slugify } from "@/lib/utils/slugify";

export const revalidate = 3600;

const EVENT_STATUSES = ["Upcoming", "Ongoing", "Completed", "Cancelled"];

function resolveStatus(slug: string): string | null {
  return EVENT_STATUSES.find((status) => slugify(status) === slug) ?? null;
}

export function generateStaticParams() {
  return EVENT_STATUSES.map((status) => ({ status: slugify(status) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ status: string }>;
}): Promise<Metadata> {
  const { status } = await params;
  const label = resolveStatus(status);
  if (!label) return {};

  const lock = await getGlobalEventsLock();
  return pageMetadata({
    title: `${label} Events & Live Shows`,
    description: `Browse ${label.toLowerCase()} live events, concerts, and shows managed by ${siteConfig.name}.`,
    path: eventStatusPath(label),
    noIndex: lock.locked,
  });
}

export default async function EventsByStatusPage({
  params,
}: {
  params: Promise<{ status: string }>;
}) {
  const { status } = await params;
  const label = resolveStatus(status);
  if (!label) notFound();

  return <EventsListView status={label} />;
}
