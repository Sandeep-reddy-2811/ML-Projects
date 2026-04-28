import React from 'react';
import StatusPill from './StatusPill';

const LEVEL_LABELS = ['None', 'Beginner', 'Intermediate', 'Advanced'];

export default function SkillGapRow({ gap }) {
  const rowClass  = gap.auto_added        ? 'auto'    : gap.current_level > 0 ? 'partial' : 'gap';
  const dotClass  = gap.auto_added        ? 'auto'    : gap.current_level > 0 ? 'partial' : 'gap';

  return (
    <div className={`skill-row ${rowClass}`}>
      <div className="skill-row-header">
        <div className="skill-row-left">
          <div className={`skill-dot ${dotClass}`} />
          <div>
            <div className="skill-row-name">
              {gap.skill}
              {gap.auto_added && (
                <span className="prereq-badge">prerequisite</span>
              )}
            </div>
            <div className="skill-row-meta">
              {gap.auto_added ? (
                <>Required: <strong>{LEVEL_LABELS[gap.required_level] || 'Beginner'}</strong> · Auto-added by skill graph</>
              ) : (
                <>
                  Required: <strong>{LEVEL_LABELS[gap.required_level] || 'Advanced'}</strong>
                  {' · '}Current: <strong>{LEVEL_LABELS[gap.current_level] || 'None'}</strong>
                  {' · '}Gap: <strong>{gap.gap_size} level{gap.gap_size !== 1 ? 's' : ''}</strong>
                </>
              )}
            </div>
          </div>
        </div>
        <StatusPill />
      </div>
    </div>
  );
}
