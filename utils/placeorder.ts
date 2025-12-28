import {
  addDoc,
  collection,
  doc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { dbClient } from "@/libs/firebase-client";
import type { Order } from "@/types/orders";

export async function placeOrder(order: Order) {
  // 1️⃣ Create order in global orders collection
  const orderRef = await addDoc(collection(dbClient, "orders"), order);

  // 2️⃣ Format date (YYYY-MM-DD)
  const date = new Date(order.createdAt || Date.now())
    .toISOString()
    .split("T")[0];

  // 3️⃣ Generate display ID
  const displayId = `PB-${date}-${orderRef.id.slice(-6).toUpperCase()}`;

  // 4️⃣ Update global order with displayId
  await updateDoc(orderRef, {
    displayId,
  });

  // 5️⃣ Create lightweight reference under user
  await setDoc(
    doc(dbClient, "users", order.userId, "orders", orderRef.id),
    {
      orderId: orderRef.id,
      displayId,
      total: order.total,
      status: order.status,
      createdAt: order.createdAt,
    }
  );

  return orderRef.id;
}
