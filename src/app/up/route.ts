import { NextResponse } from "next/server";

/** Kamal / load-balancer readiness probe. */
export function GET() {
  return new NextResponse("OK", {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
