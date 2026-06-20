import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import type { Para, Segment } from "../content/shared";

function renderSegment(seg: Segment, i: number): ReactNode {
  if (typeof seg === "string") return <Fragment key={i}>{seg}</Fragment>;
  if (seg.href.startsWith("/")) {
    return (
      <Link key={i} href={seg.href} className="seo-link">
        {seg.text}
      </Link>
    );
  }
  return (
    <a key={i} href={seg.href} className="seo-link" target="_blank" rel="noopener noreferrer">
      {seg.text}
    </a>
  );
}

/** Render a single paragraph (string or rich segments with inline links). */
export function renderPara(p: Para): ReactNode {
  if (typeof p === "string") return p;
  return p.map(renderSegment);
}

/** Render an array of paragraphs as <p> elements. */
export default function RichText({ paras, className }: { paras: Para[]; className?: string }) {
  return (
    <>
      {paras.map((p, i) => (
        <p key={i} className={className}>
          {renderPara(p)}
        </p>
      ))}
    </>
  );
}
