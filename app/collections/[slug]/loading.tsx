export default function CollectionLoading() {
  return (
    <section className="collection-page">
      {/* Header Skeleton */}
      <div className="collection-page__header">
        <div className="h-8 w-48 rounded-lg bg-[var(--card-bg-soft)] animate-pulse" />
        <div className="mt-3 h-4 w-80 max-w-full rounded bg-[var(--card-bg-soft)] animate-pulse" />
      </div>

      {/* Grid Skeleton */}
      <div className="collection-page__grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="collection-skeleton-card"
            style={{ animationDelay: `${i * 50}ms` }}
          />
        ))}
      </div>
    </section>
  );
}

