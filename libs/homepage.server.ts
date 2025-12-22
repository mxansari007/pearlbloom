import { dbAdmin } from "./firebase-admin";


export const getHomepageSections = async () => {
    const snap = await dbAdmin
      .collection("homepageSections")
      .orderBy("order", "asc")
      .get();

    return snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
  }
