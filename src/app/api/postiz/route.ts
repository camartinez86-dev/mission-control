import { NextRequest, NextResponse } from "next/server";

const POSTIZ_TOKEN = "e615254b1e4393194890a1dc9a534a3935cb66808f73b6703337bfa4cf963169";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get("endpoint");
  const postId = searchParams.get("postId");

  if (!endpoint) {
    return NextResponse.json({ error: "endpoint required" }, { status: 400 });
  }

  let url = `https://api.postiz.com/public/v1/${endpoint}`;
  if (postId) url += `/${postId}`;

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: POSTIZ_TOKEN,
        Accept: "application/json",
      },
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
