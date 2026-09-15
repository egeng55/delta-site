import { NextRequest, NextResponse } from "next/server";
import { authorizeAccessOwner } from "@/lib/accessRequestServer";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const authorization = await authorizeAccessOwner(request);
  if (!authorization.ok) {
    return NextResponse.json(
      { error: authorization.error },
      { status: authorization.status },
    );
  }

  const { id } = await context.params;
  const { data: accessRequest, error: lookupError } = await authorization.client
    .from("access_requests")
    .select("id,email,name,status")
    .eq("id", id)
    .maybeSingle();

  if (lookupError) {
    console.error("Approved access request lookup failed:", lookupError);
    return NextResponse.json({ error: "Could not send invitation." }, { status: 500 });
  }

  if (!accessRequest) {
    return NextResponse.json({ error: "Access request not found." }, { status: 404 });
  }

  if (accessRequest.status !== "approved") {
    return NextResponse.json(
      { error: "Only approved access requests can be invited." },
      { status: 409 },
    );
  }

  const configuredSiteUrl = process.env.DELTA_SITE_URL;
  const siteUrl = configuredSiteUrl ? new URL(configuredSiteUrl) : request.nextUrl;
  const redirectTo = new URL("/reset-password", siteUrl.origin).toString();

  const { data: invitation, error: inviteError } =
    await authorization.client.auth.admin.inviteUserByEmail(accessRequest.email, {
      redirectTo,
      data: {
        name: accessRequest.name,
        access_request_id: accessRequest.id,
        access_mode: "private_preview",
      },
    });

  if (inviteError) {
    console.error("Supabase access invitation failed:", inviteError);
    return NextResponse.json({ error: "Supabase could not send the invitation." }, { status: 502 });
  }

  const { data: updated, error: updateError } = await authorization.client
    .from("access_requests")
    .update({
      status: "invited",
      invited_at: new Date().toISOString(),
      reviewed_by: authorization.user.id,
      invited_user_id: invitation.user.id,
    })
    .eq("id", id)
    .eq("status", "approved")
    .select("*")
    .maybeSingle();

  if (updateError || !updated) {
    console.error("Invitation sent but access request state update failed:", updateError);
    return NextResponse.json(
      { error: "Invitation sent, but its request record needs reconciliation." },
      { status: 500 },
    );
  }

  return NextResponse.json({ request: updated });
}
