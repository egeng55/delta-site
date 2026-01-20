import { NextResponse } from "next/server";

const backendBase = (process.env.DELTA_BACKEND_URL || "http://localhost:8000").replace(/\/$/, "");

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    const response = await fetch(`${backendBase}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: "Upstream error", detail: text },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Chat proxy error:", error);
    return NextResponse.json({ error: "Failed to reach chat service" }, { status: 502 });
  }
}
