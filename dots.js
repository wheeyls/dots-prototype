// @format

import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import styles from './dots.module.css';
import { useScrollPosition, useElementPosition } from './scroll-pos.js';

const existingColors = new Set();
function matchColor(key) {
  existingColors.add(key);

  return color(Array.from(existingColors).indexOf(key));
}

function color(idx) {
  const list = [
    'bg-blue-100',
    'bg-purple-100',
    'bg-teal-100',
    'bg-purple-50',
    'bg-midnight-50',
    'bg-yellow-100',
  ];

  return list[idx % list.length];
}

function histogram(aggregates, buckets = [1, 2, 3, 4, 5]) {
  return buckets.map(i => {
    const aggregate = aggregates.find(a => a.value === i);

    return { bucket: i, value: aggregate ? aggregate.review_count : 0 };
  });
}

function expand(aggregates) {
  const expanded = [];
  let count = 0;

  aggregates.forEach(aggregate => {
    for (let i = 0, ii = aggregate.review_count; i < ii; i++) {
      expanded.push({
        value: aggregate.value,
        company_segment: aggregate.company_segment,
        idx: count,
      });
      count += 1;
    }
  });

  return expanded;
}

const DotSection = function(props) {
  const { height, children, mode, onEnter } = props;
  const [pos, setPos] = useState(0);
  const ref = useRef(null);

  useElementPosition(
    ({ percent }) => {
      if (percent > 0.5 && percent < 1.0) {
        onEnter(mode);
        setPos(percent);
      }
    },
    [],
    { ref: ref }
  );

  return (
    <div
      ref={ref}
      style={{ height: height }}
      className="scroller__section"
      data-graph-mode={mode}
    >
      <h1>{pos}</h1>
      {children}
    </div>
  );
};

function DotHistogram(props) {
  return (
    <div className="dotgraph">
      {props.nodes.map(item => (
        <div
          className={`dotgraph__dot ${matchColor(item.company_segment)}`}
        ></div>
      ))}
    </div>
  );
}

const dotSize = 5;

function barGraph(rows = 3) {
  function x(item) {
    return `${Math.floor(item.idx / rows) * dotSize}px`;
  }

  function y(item) {
    return `${(item.idx % rows) * dotSize}px`;
  }

  return { x, y };
}

function hist(padding = 0) {
  const counts = {};

  function x(item) {
    counts[item.value] = counts[item.value] || 0;
    const result = `${Math.floor(counts[item.value] / 1) * dotSize}px`;
    counts[item.value] += 1;

    return result;
  }

  function y(item) {
    return `${(item.value - 1) * (dotSize + padding)}px`;
  }

  return { x, y };
}

function segmentedHist(padding = 0) {
  const counts = { 179: { order: 0 }, 180: { order: 1 }, 181: { order: 2 } };

  function x(item) {
    const match = counts[item.company_segment];
    match[item.value] = match[item.value] || 0;
    const result = `${Math.floor(match[item.value] / 1) * dotSize}px`;

    match[item.value] += 1;

    return result;
  }

  function y(item) {
    const match = counts[item.company_segment];

    return `${(item.value - 1) * (dotSize + padding) + match.order * 38}px`;
  }

  return { x, y };
}

function Dot(props) {
  return (
    <div
      key={props.idx}
      style={{ left: props.x(props), top: props.y(props) }}
      className={`dotgraph__dot ${props.color}`}
    ></div>
  );
}

function DotBar(props) {
  return (
    <div className="dotgraph">
      {props.nodes.map(item => (
        <Dot {...item} color={props.color(item)} x={props.x} y={props.y} />
      ))}
    </div>
  );
}

function ProductGraph(props) {
  const nodes = expand(props.dataBrowser.aggregates);
  const pos = props.posFn();

  return (
    <div>
      <h3 className="l3">{props.product.name}</h3>
      <DotBar
        key={props.dataBrowser}
        x={pos.x}
        y={pos.y}
        nodes={nodes}
        color={props.color}
      />
    </div>
  );
}

function DotGraph(props) {
  function nextMode(m) {
    const list = [
      'bar',
      'bar-segment',
      'histogram',
      'histogram-segment',
      'histogram-split',
    ];
    const idx = list.indexOf(m);
    return list[(idx + 1) % list.length];
  }

  const [mode, setMode] = useState(props.mode || 'bar');

  const handleClick = () => nextMode(mode);
  let colorPicker;
  let posFn = barGraph;

  function entered(m) {
    setMode(m);
  }

  if (mode === 'bar-segment' || mode === 'histogram-segment') {
    colorPicker = item => matchColor(item.company_segment);
  } else {
    colorPicker = () => matchColor('base');
  }

  if (mode === 'histogram' || mode === 'histogram-segment') {
    posFn = hist;
  } else if (mode === 'histogram-split') {
    colorPicker = item => matchColor(item.company_segment);
    posFn = segmentedHist;
  }

  console.log({ mode });
  return (
    <div className="scroller" onClick={handleClick}>
      <div className="scroller__graph">
        <div className="scroller__graph__inner">
          {props.dataBrowser.perProduct().map(perProduct => (
            <ProductGraph
              product={perProduct.selectedProduct}
              dataBrowser={perProduct}
              posFn={posFn}
              color={colorPicker}
            />
          ))}
        </div>
      </div>
      <div className="scroller__copy">
        <DotSection
          mode="bar"
          onEnterViewport={() => setMode('bar')}
          height={window.innerHeight}
          onEnter={entered}
        >
          <p>Let's start with a raw count of reviews for each product.</p>
          <p>
            This is important for us to see how much data is powering this
            comparison. Few datapoints will highlight potential weakness in our
            data. Very large number of reviews help to show what products have
            widespread adoption vs products that perhaps target more of a niche
            market.
          </p>
        </DotSection>

        <DotSection
          mode="bar-segment"
          onEnterViewport={() => setMode('bar-segment')}
          height={window.innerHeight}
          onEnter={entered}
        >
          <p>
            Segmenting the data by company size helps to give us more granular
            picture of who is using the product.
          </p>
          <p>
            Color coding shows SMB, Mid-Market, vs Enterprise for each
            population.
          </p>
        </DotSection>

        <DotSection
          mode="histogram"
          onEnterViewport={() => setMode('histogram')}
          height={window.innerHeight}
          onEnter={entered}
        >
          <p>
            Now that we have a picture of where the reviews came from, let's
            start looking at how users rated the different products.
          </p>
          <p>Here is a breakdown of reviews based on star rating.</p>
        </DotSection>

        <DotSection
          mode="histogram-split"
          onEnterViewport={() => setMode('histogram-split')}
          height={window.innerHeight}
          onEnter={entered}
        >
          <p>
            Segmenting by company size again gives us an even more complete
            picture of who uses the product, and how successful the products are
            at satisfying different types of customers.
          </p>
        </DotSection>
      </div>
    </div>
  );
}

export { DotGraph };
