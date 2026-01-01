import { dbAdmin } from "./firebase-admin";


export const getHomepageSections = async () => {
  try {
    const snap = await dbAdmin
      .collection("homepageSections")
      .orderBy("order", "asc")
      .get();

    return snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
  } catch (error) {
    console.error("getHomepageSections failed:", error);
    return [];
  }
}
