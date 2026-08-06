import { NextRequest, NextResponse } from "next/server";
import { authorizeAccessOwner } from "@/lib/accessRequestServer";
import {
  canOwnerTransitionAccessRequest,
  isAccessRequestStatus,
  type AccessRequestStatus,
} from "@/lib/accessRequests";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const authorization = await authorizeAccessOwner(request);
  if (!authorization.ok) {
    return NextResponse.json(
      { error: authorization.error },
      { status: authorization.status },
    );
  }

  const { id } = await context.params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const requestedStatus =
    typeof body === "object" && body !== null ? Reflect.get(body, "status") : undefined;

  if (!isAccessRequestStatus(requestedStatus) || requestedStatus === "invited") {
    return NextResponse.json({ error: "Invalid access request state." }, { status: 400 });
  }

  const { data: current, error: lookupError } = await authorization.client
    .from("access_requests")
    .select("id,status")
    .eq("id", id)
    .maybeSingle();

  if (lookupError) {
    console.error("Access request lookup failed:", lookupError);
    return NextResponse.json({ error: "Could not update access request." }, { status: 500 });
  }

  if (!current) {
    return NextResponse.json({ error: "Access request not found." }, { status: 404 });
  }

  if (!isAccessRequestStatus(current.status)) {
    console.error("Access request has an invalid stored state:", current.status);
    return NextResponse.json({ error: "Could not update access request." }, { status: 500 });
  }

  const currentStatus: AccessRequestStatus = current.status;
  if (!canOwnerTransitionAccessRequest(currentStatus, requestedStatus)) {
    return NextResponse.json({ error: "Invalid lifecycle transition." }, { status: 409 });
  }

  const { data, error } = await authorization.client
    .from("access_requests")
    .update({
      status: requestedStatus,
      reviewed_at: new Date().toISOString(),
      reviewed_by: authorization.user.id,
    })
    .eq("id", id)
    .eq("status", currentStatus)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("Access request update failed:", error);
    return NextResponse.json({ error: "Could not update access request." }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Access request changed; refresh and retry." }, { status: 409 });
  }

  return NextResponse.json({ request: data });
}
