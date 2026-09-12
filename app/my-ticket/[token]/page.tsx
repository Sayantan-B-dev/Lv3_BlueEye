import TicketView from "@/components/ticketing/TicketView";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  return {
    title: "My Ticket | Blue Eye Entertainment",
    description: "Your digital event ticket with entry QR code.",
    robots: { index: false, follow: false },
  };
}

export default async function MyTicketPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <TicketView token={token} />;
}
