// @format

import { useRef, useLayoutEffect } from 'react';

const isBrowser = typeof window !== `undefined`;

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

export function useElementPosition(
  effect,
  deps,
  { element, useWindow, wait = 50, ref }
) {
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

      console.log({ threshold, bottom, top, pos, currPos });

      effect({ percent: pos });
    },
    deps,
    { element, useWindow, wait }
  );
}
