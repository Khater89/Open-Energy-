import { NextRequest, NextResponse } from "next/server";
import { currentUser, unavailable } from "@/lib/security";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser(req);
    return NextResponse.json(
      { user },
      { status: user ? 200 : 401, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return unavailable();
  }
}
