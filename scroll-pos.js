// @format

import { useRef, useLayoutEffect } from 'react';

const isBrowser = typeof window !== `undefined`;

function sortBy(list, cb) {
  const pairs = list.map(item => [cb(item), item]);

  pairs.sort((a, b) => a[0] - b[0]);
  return pairs.map(pair => pair[1]);
}

function getScrollPosition({ element, useWindow }) {
  if (!isBrowser) return { x: 0, y: 0 };

  const target = element ? element.current : document.body;
  const position = target.getBoundingClientRect();

  return useWindow
    ? { x: window.scrollX, y: window.scrollY }
    : { x: position.left, y: position.top };
}

export function useScrollPosition(
  effect,
  deps,
  { element, useWindow, wait = 50 } = {}
) {
  const position = useRef(getScrollPosition({ useWindow }));

  let throttleTimeout = null;

  const callBack = () => {
    const currPos = getScrollPosition({ element, useWindow });
    effect({ prevPos: position.current, currPos });
    position.current = currPos;
    throttleTimeout = null;
  };

  useLayoutEffect(() => {
    const handleScroll = () => {
      if (wait) {
        if (throttleTimeout === null) {
          throttleTimeout = setTimeout(callBack, wait);
        }
      } else {
        callBack();
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  }, deps);
}

const refs = new Set();

function runTest({ offset, elements }) {
  const midline = document.body.scrollTop + window.innerHeight * offset;
  console.log(midline, document.body.scrollTop, window.innerHeight);

  const sorted = sortBy(Array.from(elements), function(item) {
    const el = item.current;
    const top = el.offsetTop;
    const bottom = top + el.offsetHeight;

    if (top <= midline && bottom >= midline) {
      return -1;
    } else if (bottom < midline) {
      return midline - bottom;
    } else {
      // top > midline
      return top - midline;
    }
  });

  return sorted[0];
}

export function useElementPosition(
  effect,
  deps,
  { element, useWindow, wait = 50, ref }
) {
  refs.add(ref);
  console.log(refs);
  useScrollPosition(
    ({ currPos, prevPos }) => {
      const threshold = window.innerHeight - currPos.y;
      const top = ref.current.offsetTop;
      const bottom = top + ref.current.offsetHeight;
      let pos = 0;

      if (threshold >= bottom) {
        pos = 1;
      } else if (threshold >= top) {
        pos = (threshold - top) / (bottom - top);
      }

      effect({ percent: pos });
    },
    deps,
    { element, useWindow, wait }
  );
}
