import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import TicketOrder from "@/lib/models/TicketOrder";
import Ticket from "@/lib/models/Ticket";
import { requireTicketingStaff } from "../_guard";

function csvCell(v: any): string {
  const s = v === null || v === undefined ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

// ADMIN + STAFF: export orders+tickets as CSV.
export async function GET(request: Request) {
  const { error } = await requireTicketingStaff();
  if (error) return error;
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    await connectToDatabase();
    const orders: any[] = await TicketOrder.find(eventId ? { eventId } : {})
      .sort({ createdAt: -1 })
      .lean();
    const header = [
      "Order ID", "Ticket ID", "Customer name", "Phone", "Email",
      "Ticket category", "Amount (INR)", "Payment status", "Ticket status",
      "Check-in status", "Purchase date",
    ];
    const lines = [header.map(csvCell).join(",")];
    for (const o of orders) {
      const tickets: any[] = await Ticket.find({ orderId: o._id }).lean();
      const amount = ((o.totalPaise || 0) / 100).toFixed(2);
      const rows = tickets.length ? tickets : [null];
      for (const t of rows) {
        lines.push(
          [
            o.orderCode,
            t?.ticketCode || "",
            o.buyer?.name || "",
            o.buyer?.phone || "",
            o.buyer?.email || "",
            t?.tierName || o.items?.[0]?.tierName || "",
            amount,
            o.status,
            t?.status || "",
            t?.checkedInAt ? new Date(t.checkedInAt).toISOString() : "",
            new Date(o.createdAt).toISOString(),
          ]
            .map(csvCell)
            .join(",")
        );
      }
    }
    return new NextResponse(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="ticket-orders-${Date.now()}.csv"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
