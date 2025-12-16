import { Timestamp } from "firebase-admin/firestore";

/**
 * Converts Firestore Timestamp & complex objects
 * into JSON-safe plain objects for Next.js
 */
export function serializeFirestore<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_key, value) => {
      if (value instanceof Timestamp) {
        return value.toDate().toISOString();
      }
      return value;
    })
  );
}
