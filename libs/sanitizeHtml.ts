import sanitizeHtml from "sanitize-html";

/**
 * Sanitize admin-authored blog HTML before rendering. Allows only the tags the
 * TipTap editor produces; forces safe rels/targets and lazy images.
 */
export function cleanBlogHtml(dirty: string): string {
  return sanitizeHtml(dirty || "", {
    allowedTags: [
      "h2", "h3", "h4", "p", "a", "ul", "ol", "li",
      "blockquote", "strong", "em", "b", "i", "u", "s", "br", "span", "img",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "width", "height", "loading", "class"],
      span: ["class"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: (_tag, attribs) => {
        const href = attribs.href || "";
        const external = /^https?:\/\//i.test(href);
        return {
          tagName: "a",
          attribs: external
            ? { ...attribs, target: "_blank", rel: "noopener noreferrer" }
            : attribs,
        };
      },
      img: (_tag, attribs) => ({ tagName: "img", attribs: { ...attribs, loading: "lazy" } }),
    },
  });
}
