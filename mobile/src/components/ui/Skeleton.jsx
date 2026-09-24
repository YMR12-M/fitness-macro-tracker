/** Placeholder blocks that hold a screen's shape while its data loads.
 *
 *  Preferred over a spinner wherever the final layout is already known: the
 *  page keeps its height instead of collapsing and then jumping when the
 *  response lands, which on a phone is the difference between a smooth load
 *  and the content moving under a thumb that is already reaching for it. */
export function Skeleton({ height = 16, width = '100%', radius, style, ...rest }) {
  return (
    <span
      className="skeleton"
      aria-hidden="true"
      style={{ display: 'block', height, width, ...(radius ? { borderRadius: radius } : {}), ...style }}
      {...rest}
    />
  );
}

/** A card-shaped placeholder, repeated `count` times. */
export function SkeletonCards({ count = 3, height = 84 }) {
  return (
    <div className="stack" role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} height={height} radius="var(--radius)" />
      ))}
    </div>
  );
}

/** Matching placeholder for a `.list` of rows. */
export function SkeletonList({ count = 4 }) {
  return (
    <div className="list" role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} height={56} radius="12px" />
      ))}
    </div>
  );
}
