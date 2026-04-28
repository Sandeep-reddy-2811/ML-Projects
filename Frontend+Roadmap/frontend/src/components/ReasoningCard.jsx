import React, { useState } from 'react';

export default function ReasoningCard({ points = [], traceText }) {
  const [open, setOpen] = useState(false);

  if (!points.length && !traceText) return null;

  return (
    <div className="reasoning-card">
      {/* Header / toggle */}
      <div className="reasoning-header" onClick={() => setOpen(o => !o)}>
        <div className="reasoning-header-left">
          <div className="reasoning-icon">🧠</div>
          <div>
            <div className="reasoning-title">AI Reasoning Trace</div>
            <div className="reasoning-subtitle">Why this learning path was chosen for you</div>
          </div>
        </div>
        <div className="reasoning-toggle">{open ? '▲ Collapse' : '▼ Expand'}</div>
      </div>

      {/* Body */}
      {open && (
        <div className="reasoning-body">

          {/* Pointwise analysis */}
          {points.length > 0 && (
            <div className="r-steps">
              {points.map((pt, i) => (
                <div key={i} className="r-step">
                  <div className={`r-step-icon ${pt.iconClass}`}>{pt.icon}</div>
                  <div className="r-step-content">
                    <div className="r-step-title">{pt.title}</div>
                    <div className="r-step-body">{pt.body}</div>
                    {pt.badge && (
                      <div className={`r-step-badge ${pt.badgeClass}`}>{pt.badge}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Full paragraph */}
          {traceText && (
            <>
              <div className="r-trace-label">Full reasoning text</div>
              <div className="r-trace-text">{traceText}</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
