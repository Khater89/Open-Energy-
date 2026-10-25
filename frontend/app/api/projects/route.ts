import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { unavailable } from "@/lib/security";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const r = await db.query(
      "SELECT id,title,system_type,location,summary,image_url FROM projects ORDER BY is_featured DESC,created_at DESC LIMIT 100",
    );
    return NextResponse.json({ projects: r.rows });
  } catch {
    return unavailable();
  }
}
