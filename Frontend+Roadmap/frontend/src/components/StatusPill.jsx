import React, { useState } from 'react';

const STATES = ['○ not started', '▶ in progress', '✓ done'];
const CLASSES = ['idle', 'active', 'done'];

export default function StatusPill({ onChange }) {
  const [idx, setIdx] = useState(0);

  const cycle = (e) => {
    e.stopPropagation();
    const next = (idx + 1) % 3;
    setIdx(next);
    onChange?.(next);
  };

  return (
    <button className={`status-pill ${CLASSES[idx]}`} onClick={cycle}>
      {STATES[idx]}
    </button>
  );
}
