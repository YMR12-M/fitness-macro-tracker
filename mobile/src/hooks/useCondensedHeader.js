import { useEffect, useState } from 'react';

/**
 * True once the page has scrolled past `threshold`. The app bar uses it to
 * grow a hairline border, so a translucent bar never floats over content with
 * nothing separating the two.
 *
 * Reads are passive and cheap — one boolean comparison per scroll event, and
 * state only changes when the answer flips, so this does not re-render on
 * every frame of a scroll.
 */
export function useCondensedHeader(threshold = 8) {
  const [condensed, setCondensed] = useState(false);

  useEffect(() => {
    const onScroll = () => setCondensed(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return condensed;
}
