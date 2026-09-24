/**
 * Bring a child into view inside a horizontally scrolling container, without
 * touching the page's vertical scroll.
 *
 * `Element.scrollIntoView` cannot do this: every `block` value it accepts still
 * scrolls the nearest scrollable ancestor on *both* axes, so calling it on a
 * segmented control that happens to be below the fold silently jumps the whole
 * screen down to it on mount. This only ever writes `scrollLeft` on the
 * container it is given.
 *
 * A child already fully visible is left alone, so this is safe to call on every
 * render of a value that rarely changes.
 */
export function scrollChildIntoViewX(container, child) {
  if (!container || !child) return;

  const bounds = container.getBoundingClientRect();
  const target = child.getBoundingClientRect();

  if (target.left >= bounds.left && target.right <= bounds.right) return;

  // Centre it where there is room; the browser clamps at both ends for us.
  container.scrollLeft += target.left - bounds.left - (bounds.width - target.width) / 2;
}
