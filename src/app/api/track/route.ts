import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getCurrentAdminSession, getCurrentClientSession } from "@/lib/auth";
import { findTrackingRecord } from "@/lib/repository";
import { trackingQuerySchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const [adminSession, clientSession] = await Promise.all([
      getCurrentAdminSession(),
      getCurrentClientSession(),
    ]);

    if (!adminSession && !clientSession) {
      return NextResponse.json(
        {
          ok: false,
          message: "Sign in to access tracking details.",
        },
        { status: 401 },
      );
    }

    const payload = trackingQuerySchema.parse({
      q: request.nextUrl.searchParams.get("q") ?? "",
    });
    const record = await findTrackingRecord(payload.q, clientSession?.clientId);

    if (!record) {
      return NextResponse.json(
        {
          ok: false,
          message: "No matching delivery was found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      delivery: {
        trackingCode: record.trackingCode,
        status: record.status,
        zone: record.zone,
        clientName: record.clientName,
        recipientName: record.recipientName,
        driverName: record.driverName,
        eta: record.eta,
        paymentStatus: record.paymentStatus,
        outstandingBalance: Math.max(record.quotedPrice - record.amountPaid, 0),
        pickupAddress: record.pickupAddress,
        dropoffAddress: record.dropoffAddress,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Unable to search tracking.",
      },
      { status: 400 },
    );
  }
}
