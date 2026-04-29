import { NextRequest, NextResponse } from "next/server";

const POSTIZ_TOKEN = "e615254b1e4393194890a1dc9a534a3935cb66808f73b6703337bfa4cf963169";
const POSTIZ_BASE = "https://api.postiz.com/public/v1";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get("endpoint");

  if (!endpoint) {
    return NextResponse.json({ error: "endpoint required" }, { status: 400 });
  }

  const params = new URLSearchParams();
  const integrationId = searchParams.get("integrationId");
  if (integrationId) params.set("integrationId", integrationId);

  const url = `${POSTIZ_BASE}/${endpoint}${params.toString() ? "?" + params.toString() : ""}`;

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: POSTIZ_TOKEN,
        Accept: "application/json",
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Postiz error: ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Postiz fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch from Postiz" }, { status: 500 });
  }
}
