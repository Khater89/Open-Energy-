import { intake } from "@/lib/intake";
import { NextRequest } from "next/server";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  return intake(req, "contact");
}
