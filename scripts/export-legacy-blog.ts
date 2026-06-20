/* One-off: convert the legacy code-authored blog posts into the admin/Firestore
   shape and write JSON for the admin "Import existing posts" button.
   Run: npx tsx scripts/export-legacy-blog.ts  (from the storefront root) */
import { writeFileSync } from "node:fs";
import { getAllPosts } from "../content/blog";
import { blogPostToDoc } from "../libs/blogConvert";

const docs = getAllPosts().map(blogPostToDoc);
writeFileSync("legacy-blog.json", JSON.stringify(docs, null, 2));
console.log(`Exported ${docs.length} posts -> legacy-blog.json`);
