import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { connectToDatabase } from "@/lib/db/connect";
import Inquiry from "@/lib/models/Inquiry";
import InquiryBackup from "@/lib/models/InquiryBackup";
import Event from "@/lib/models/Event";
import EventBackup from "@/lib/models/EventBackup";

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type } = await req.json();
    if (!type || (type !== "inquiries" && type !== "events")) {
      return NextResponse.json({ error: "Invalid sync type. Must be 'inquiries' or 'events'." }, { status: 400 });
    }

    await connectToDatabase();

    if (type === "inquiries") {
      const backupDocs = await InquiryBackup.find().lean();
      if (backupDocs.length === 0) {
        return NextResponse.json({ error: "No backup data found to sync." }, { status: 404 });
      }
      await Inquiry.deleteMany({});
      await Inquiry.insertMany(backupDocs);
      return NextResponse.json({ success: true, count: backupDocs.length });
    } else {
      const backupDocs = await EventBackup.find().lean();
      if (backupDocs.length === 0) {
        return NextResponse.json({ error: "No backup data found to sync." }, { status: 404 });
      }
      await Event.deleteMany({});
      await Event.insertMany(backupDocs);
      return NextResponse.json({ success: true, count: backupDocs.length });
    }
  } catch (error: any) {
    console.error("Sync error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type } = await req.json();
    if (!type || (type !== "inquiries" && type !== "events")) {
      return NextResponse.json({ error: "Invalid backup type. Must be 'inquiries' or 'events'." }, { status: 400 });
    }

    await connectToDatabase();

    if (type === "inquiries") {
      const inquiries = await Inquiry.find().lean();
      await InquiryBackup.deleteMany({});
      if (inquiries.length > 0) {
        // Strip out validation constraints or just insert
        await InquiryBackup.insertMany(inquiries);
      }
      return NextResponse.json({ success: true, count: inquiries.length });
    } else {
      const events = await Event.find().lean();
      await EventBackup.deleteMany({});
      if (events.length > 0) {
        await EventBackup.insertMany(events);
      }
      return NextResponse.json({ success: true, count: events.length });
    }
  } catch (error: any) {
    console.error("Backup error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
