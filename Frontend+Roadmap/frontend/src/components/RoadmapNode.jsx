import React, { useState } from 'react';
import StatusPill from './StatusPill';

const LEVEL_NUM_CLASS = {
  beginner:     'lvl-low',
  intermediate: 'lvl-mid',
  expert:       'lvl-high',
  advanced:     'lvl-high',
};
const LEVEL_PILL_CLASS = {
  beginner:     'low',
  intermediate: 'mid',
  expert:       'high',
  advanced:     'high',
};

export default function RoadmapNode({ step, index, onStatusChange }) {
  const [done, setDone] = useState(false);

  const lvlKey    = step.level?.toLowerCase() || 'intermediate';
  const numClass  = done ? 'lvl-done' : (LEVEL_NUM_CLASS[lvlKey]  || 'lvl-mid');
  const pillClass = LEVEL_PILL_CLASS[lvlKey] || 'mid';

  const handleChange = (idx) => {
    const isDone = idx === 2;
    setDone(isDone);
    onStatusChange?.(index, idx, step.duration_weeks || 0);
  };

  return (
    <div className="roadmap-node" style={{ animationDelay: `${index * 0.06}s` }}>

      {/* Step number bubble */}
      <div className={`node-num ${numClass}`}>
        {done ? '✓' : String(step.step_number).padStart(2, '0')}
      </div>

      {/* Card body */}
      <div className={`node-body${done ? ' is-done' : ''}`}>
        <div className="node-header">
          <div className={`node-title${done ? ' done-txt' : ''}`}>
            {step.course_title}
          </div>
          <div className="node-header-right">
            <StatusPill onChange={handleChange} />
            <div className={`node-level-pill ${pillClass}`}>{step.level}</div>
          </div>
        </div>

        <div className="node-skill-badge">Skill: {step.skill}</div>
        <div className="node-desc">{step.reason}</div>

        {(step.tags || []).length > 0 && (
          <div className="node-tags">
            {step.tags.map(t => (
              <span key={t} className="node-tag">{t}</span>
            ))}
          </div>
        )}

        <div className="node-footer">
          <div className="node-duration">
            <span className="dur-dot" />
            ~{step.duration_weeks} week{step.duration_weeks !== 1 ? 's' : ''} estimated
          </div>
          {step.link && (
            <a
              href={step.link}
              target="_blank"
              rel="noreferrer"
              className="node-course-link"
            >
              Open course →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
