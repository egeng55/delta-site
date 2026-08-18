import { NextResponse } from "next/server";
import { getSiteDeploymentMetadata } from "@/lib/deploymentMetadata";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "delta-site",
    ...getSiteDeploymentMetadata(),
  });
}
