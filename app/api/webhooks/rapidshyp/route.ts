import { NextResponse } from "next/server";
import { dbAdmin } from "@/libs/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// More comprehensive payload interface based on common aggregation patterns
// and allowing for variations.
interface RapidShypWebhookPayload {
  awb?: string;
  order_id?: string;
  status?: string; 
  current_status?: string;
  scan_location?: string;
  scan_time?: string;
  timestamp?: string;
  message?: string;
  remark?: string;
  scans?: {
    location?: string;
    status?: string;
    timestamp?: string;
    message?: string;
  }[];
  // Some aggregators wrap details in a 'shipment' or 'tracking' object
  shipment?: {
    awb?: string;
    status?: string;
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("📦 [RapidShyp Webhook] Received payload:", JSON.stringify(body, null, 2));

    const payload = body as RapidShypWebhookPayload;
    
    // 1. Identify the Order
    // Handle top-level or nested AWB/Order ID
    const awb = payload.awb || payload.shipment?.awb;
    const orderId = payload.order_id; // Could be our internal ID or displayId

    if (!awb && !orderId) {
      console.warn("⚠️ [RapidShyp Webhook] No AWB or Order ID found in payload");
      return NextResponse.json({ message: "Ignored: Missing identifiers" }, { status: 200 });
    }

    // Search for the order in Firestore
    let orderDoc = null;
    let orderRef = null;
    const ordersCollection = dbAdmin.collection("orders");

    // Try finding by AWB first
    if (awb) {
      const q = await ordersCollection.where("tracking.awb", "==", awb).limit(1).get();
      if (!q.empty) {
        orderDoc = q.docs[0];
        orderRef = orderDoc.ref;
      }
    }

    // If not found by AWB, try by Order ID
    if (!orderDoc && orderId) {
      const docById = await ordersCollection.doc(orderId).get();
      if (docById.exists) {
        orderDoc = docById;
        orderRef = docById.ref;
      } else {
        const q = await ordersCollection.where("displayId", "==", orderId).limit(1).get();
        if (!q.empty) {
          orderDoc = q.docs[0];
          orderRef = orderDoc.ref;
        }
      }
    }

    if (!orderDoc || !orderRef) {
      console.warn(`⚠️ [RapidShyp Webhook] Order not found for AWB: ${awb} or ID: ${orderId}`);
      return NextResponse.json({ message: "Order not found" }, { status: 200 });
    }

    // 2. Determine New Status & Tracking Event
    // Prioritize explicit status fields
    const rawStatus = (payload.status || payload.current_status || payload.shipment?.status || "").toUpperCase();
    
    // Normalize status for our system
    let newStatus: string | null = null;
    if (rawStatus.includes("DELIVERED")) {
      newStatus = "delivered";
    } else if (
      rawStatus.includes("SHIPPED") || 
      rawStatus.includes("TRANSIT") || 
      rawStatus.includes("OUT FOR DELIVERY") ||
      rawStatus.includes("PICKED UP") ||
      rawStatus.includes("DISPATCHED")
    ) {
      newStatus = "shipped";
    } else if (rawStatus.includes("CANCELLED")) {
      newStatus = "cancelled";
    }

    // 3. Construct Tracking Event
    // We want to append this update to the 'tracking.events' array
    const eventLocation = payload.scan_location || "Unknown Location";
    const eventMessage = payload.message || payload.remark || rawStatus;
    const eventTime = payload.scan_time || payload.timestamp || new Date().toISOString();

    const newEvent = {
      status: rawStatus || "UPDATED",
      location: eventLocation,
      timestamp: eventTime,
      message: eventMessage
    };

    // 4. Update Order
    const updateData: Record<string, unknown> = {
      updatedAt: Date.now(),
      // Add the new event to the tracking.events array
      "tracking.events": FieldValue.arrayUnion(newEvent)
    };

    if (newStatus) {
      updateData.status = newStatus;
    }

    // IMPORTANT: Ensure AWB is saved if not already present or if it's being updated
    if (awb) {
      updateData["tracking.awb"] = awb;
    }

    // If payload has a full 'scans' history, we might want to replace the whole list
    // But usually webhooks send incremental updates.
    // If we receive a full list, we could do: updateData["tracking.events"] = payload.scans;
    
    await orderRef.update(updateData);

    console.log(`✅ [RapidShyp Webhook] Updated Order ${orderDoc.id} status: ${newStatus || 'unchanged'} | Event: ${rawStatus}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ [RapidShyp Webhook] Error processing request:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
