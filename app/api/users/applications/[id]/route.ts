import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { connectToDatabase } from "@/lib/db/connect";
import ArtistApplicant from "@/lib/models/ArtistApplicant";
import { artistApplicantSchemaValidation } from "@/lib/utils/validators";
import { getErrorMessage, privateApiSuccess, privateApiError } from "@/lib/utils/apiResponse";

async function verifyOwnership(id: string, userId: string, userEmail: string) {
  await connectToDatabase();
  const doc = await ArtistApplicant.findById(id);
  if (!doc) return { doc: null, error: privateApiError("Application not found", 404) };
  const owns =
    (doc.userId && doc.userId.toString() === userId) ||
    doc.applicantEmail?.toLowerCase() === userEmail?.toLowerCase();
  if (!owns) return { doc: null, error: privateApiError("Forbidden", 403) };
  return { doc, error: null };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user;
    if (!sessionUser) return privateApiError("Unauthorized", 401);

    const { doc, error } = await verifyOwnership(id, sessionUser.id || "", sessionUser.email || "");
    if (error) return error;

    return privateApiSuccess(doc);
  } catch (error) {
    return privateApiError(getErrorMessage(error, "Failed to fetch application"), 500);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user;
    if (!sessionUser) return privateApiError("Unauthorized", 401);

    const { doc, error } = await verifyOwnership(id, sessionUser.id || "", sessionUser.email || "");
    if (error) return error;

    if (doc.status === "approved") {
      return privateApiError("Cannot edit an approved application. It has already been added to the artist database.", 400);
    }

    const body = await request.json();
    const result = artistApplicantSchemaValidation.safeParse(body);
    if (!result.success) {
      return privateApiError(result.error.issues[0].message, 400, result.error.issues);
    }

    const updateData: Record<string, unknown> = { ...result.data };
    if (doc.status === "rejected") {
      updateData.status = "pending";
      updateData.rejectedAt = undefined;
    }

    const updated = await ArtistApplicant.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).lean();

    return privateApiSuccess(updated, "Application updated successfully");
  } catch (error) {
    return privateApiError(getErrorMessage(error, "Failed to update application"), 500);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user;
    if (!sessionUser) return privateApiError("Unauthorized", 401);

    const { doc, error } = await verifyOwnership(id, sessionUser.id || "", sessionUser.email || "");
    if (error) return error;

    if (doc.status === "approved") {
      return privateApiError("Cannot delete an approved application. Contact admin for removal.", 400);
    }

    await ArtistApplicant.findByIdAndDelete(id);
    return privateApiSuccess(null, "Application deleted successfully");
  } catch (error) {
    return privateApiError(getErrorMessage(error, "Failed to delete application"), 500);
  }
}
