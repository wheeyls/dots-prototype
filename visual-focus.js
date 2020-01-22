// @format

let current = null;
const elements = [];
const callbacks = [];

function sortBy(list, cb) {
  const pairs = list.map(item => [cb(item), item]);

  pairs.sort((a, b) => a[0] - b[0]);
  console.log(pairs);
  return pairs.map(pair => pair[1]);
}

function runTest({ offset, elements, current }) {
  const midline = document.body.scrollTop + window.innerHeight * offset;
  console.log(midline, document.body.scrollTop, window.innerHeight);

  const sorted = sortBy(elements, function(item) {
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

function noop() {}
function start({ offset }) {
  window.setInterval(() => {
    runTest({ elements, offset, current });
  }, 100);
  start = function() {};
}

export function visualFocus(ref, { onEnter = noop, offset = 0.5 }) {
  if (elements.length === 0) {
    current = ref;
  }

  elements.push(ref);
  callbacks.push();
  start({ offset });
}
