/**
 * One-time migration: re-key every `products` document so its document ID is
 * the product's `slug` (was a random UUID). After this runs, the storefront
 * reads products with a direct `doc(slug)` get instead of a slug query.
 *
 *   Dry run (default, writes nothing):  npx tsx scripts/migrate-product-slugs.ts
 *   Apply:                              npx tsx scripts/migrate-product-slugs.ts --apply
 *
 * What it does, per product whose id !== slug:
 *   - creates a new doc `products/{slug}` with the same data, then deletes the
 *     old auto-id doc (an atomic batch per product).
 * It SKIPS (and reports) products with no slug and slug collisions — it never
 * overwrites an existing slug-keyed doc.
 *
 * Caveats (printed at the end):
 *   - product URLs already use slug, so SEO/links are unaffected.
 *   - anything that stored the OLD product id (in-flight client carts /
 *     wishlists in localStorage) won't resolve until re-added; order documents
 *     hold item snapshots so historical orders display fine.
 *   - run during low traffic.
 */
import "dotenv/config";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const APPLY = process.argv.includes("--apply");

function initAdmin() {
  if (getApps().length) return getFirestore();
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKey) {
    console.error(
      "Missing FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY in .env"
    );
    process.exit(1);
  }
  privateKey = privateKey.replace(/\\n/g, "\n");
  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return getFirestore();
}

async function main() {
  const db = initAdmin();
  const snap = await db.collection("products").get();

  const alreadyKeyed: string[] = [];
  const noSlug: string[] = [];
  const collisions: string[] = [];
  const toMigrate: { oldId: string; slug: string; data: FirebaseFirestore.DocumentData }[] = [];

  // First pass: classify. Track target slugs we plan to write so two source
  // docs sharing a slug don't both think they own it.
  const claimedSlugs = new Set<string>();
  for (const doc of snap.docs) {
    const data = doc.data();
    const slug = typeof data.slug === "string" ? data.slug.trim() : "";
    if (!slug) {
      noSlug.push(doc.id);
      continue;
    }
    if (doc.id === slug) {
      alreadyKeyed.push(slug);
      claimedSlugs.add(slug);
      continue;
    }
    if (claimedSlugs.has(slug)) {
      collisions.push(`${doc.id} -> ${slug} (slug already claimed by another product)`);
      continue;
    }
    claimedSlugs.add(slug);
    toMigrate.push({ oldId: doc.id, slug, data });
  }

  // Second pass: verify the slug-keyed target doesn't already exist as a
  // DIFFERENT document we didn't account for.
  const planned: typeof toMigrate = [];
  for (const item of toMigrate) {
    const target = await db.collection("products").doc(item.slug).get();
    if (target.exists) {
      collisions.push(`${item.oldId} -> ${item.slug} (target doc already exists)`);
      continue;
    }
    planned.push(item);
  }

  console.log(`\nProducts scanned:       ${snap.size}`);
  console.log(`Already keyed by slug:  ${alreadyKeyed.length}`);
  console.log(`Missing slug (skipped): ${noSlug.length}${noSlug.length ? " -> " + noSlug.join(", ") : ""}`);
  console.log(`Collisions (skipped):   ${collisions.length}`);
  collisions.forEach((c) => console.log(`   ! ${c}`));
  console.log(`To migrate:             ${planned.length}`);
  planned.forEach((p) => console.log(`   ${p.oldId}  ->  ${p.slug}`));

  if (!APPLY) {
    console.log(`\nDry run — nothing written. Re-run with --apply to migrate.`);
    return;
  }

  let done = 0;
  for (const item of planned) {
    const batch = db.batch();
    batch.set(db.collection("products").doc(item.slug), item.data);
    batch.delete(db.collection("products").doc(item.oldId));
    await batch.commit();
    done += 1;
  }

  console.log(`\nMigrated ${done} product(s) to slug-keyed document ids.`);
  console.log(
    `Reminder: in-flight client carts/wishlists holding old product ids will ` +
      `lose those items until re-added; order documents are unaffected. Once ` +
      `every environment is migrated, remove the query fallbacks in ` +
      `libs/products.client.ts and libs/products.server.ts.`
  );
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  }
);
