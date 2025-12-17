import { dbAdmin } from "./firebase-admin";
import { unstable_noStore as noStore } from "next/cache";


noStore();


export async function getHomepageSections() {
  const snap = await dbAdmin
    .collection("homepageSections")
    .orderBy("order", "asc")
    .get();

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}
