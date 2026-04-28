import React, { useState, useEffect } from 'react';
import useCountUp from '../hooks/useCountUp';
import SkillGapRow from './SkillGapRow';
import RoadmapNode from './RoadmapNode';
import ReasoningCard from './ReasoningCard';
import '../styles/SkillGapPanel.css';

export default function SkillGapPanel({ data, onReset }) {
  const [barWidth, setBarWidth] = useState(0);
  const [stepStatuses, setStepStatuses] = useState(() =>
    (data.learning_path || []).map((s) => ({ status: 0, weeks: s.duration_weeks || 0 }))
  );

  const stats        = data.summary_stats  || {};
  const learningPath = data.learning_path  || [];
  const expandedGaps = data.expanded_gaps  || data.skill_gaps || [];
  const totalWeeks   = stats.total_weeks   || 0;

  // Animated counters
  const matchPct = useCountUp(data.match_percent || 0);
  const haveCnt  = useCountUp((data.skills_have || []).length, 1000);
  const gapCnt   = useCountUp(stats.original_gaps || (data.skill_gaps || []).length, 1000);
  const stepCnt  = useCountUp(stats.total_steps || learningPath.length, 1000);
  const weekCnt  = useCountUp(totalWeeks, 1100);

  // Animate readiness bar in
  useEffect(() => { setTimeout(() => setBarWidth(data.match_percent || 0), 120); }, [data.match_percent]);

  // Progress tracking
  const doneCount = stepStatuses.filter(s => s.status === 2).length;
  const ipCount   = stepStatuses.filter(s => s.status === 1).length;
  const todoCount = stepStatuses.filter(s => s.status === 0).length;
  const doneWeeks = stepStatuses.filter(s => s.status === 2).reduce((a, s) => a + s.weeks, 0);
  const ipWeeks   = stepStatuses.filter(s => s.status === 1).reduce((a, s) => a + s.weeks, 0);
  const remWeeks  = stepStatuses.filter(s => s.status <  2).reduce((a, s) => a + s.weeks, 0);
  const donePct   = totalWeeks ? Math.round((doneWeeks / totalWeeks) * 100) : 0;
  const ipPct     = totalWeeks ? Math.round((ipWeeks   / totalWeeks) * 100) : 0;

  const handleStatusChange = (index, newStatus, weeks) => {
    setStepStatuses(prev => {
      const next = [...prev];
      next[index] = { status: newStatus, weeks };
      return next;
    });
  };

  // Level badge class
  const expLevel = (data.experience_level || '').toLowerCase();
  const levelBadgeClass = `level-badge ${expLevel}`;

  return (
    <div className="panel-anim">

      {/* ── Profile card ───────────────────────────────────── */}
      <div className="profile-card">
        <div className="profile-avatar">
          {(data.candidate_name || 'U').split(' ').map(w => w[0]).slice(0, 2).join('')}
        </div>
        <div className="profile-info">
          <div className="profile-name">{data.candidate_name || 'Candidate'}</div>
          <div className="profile-meta">
            {data.years_experience} yrs experience
            {data.current_title ? ` · ${data.current_title}` : ''}
          </div>
          <div className="profile-meta">{data.summary}</div>
        </div>
        <div className={levelBadgeClass}>{data.experience_level || 'Intermediate'}</div>
      </div>

      {/* ── Role banner ────────────────────────────────────── */}
      <div className="role-banner">
        <div className="role-banner-left">
          <div className="role-banner-label">Target Role</div>
          <div className="role-banner-title">{data.job_title}</div>
          {stats.skill_gap_summary && (
            <div className="role-banner-summary">{stats.skill_gap_summary}</div>
          )}
        </div>
        <div className="match-circle">
          <div className="match-circle-pct">64%</div>
          <div className="match-circle-label">match</div>
        </div>
      </div>

      {/* ── Stat cards ─────────────────────────────────────── */}
      <div className="stats-row">
        <div className="stat-card green">
          <div className="stat-label">Skills Ready</div>
          <div className="stat-value">{haveCnt}</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Skill Gaps</div>
          <div className="stat-value">{gapCnt}</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-label">Training Steps</div>
          <div className="stat-value">{stepCnt}</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-label">Weeks to Ready</div>
          <div className="stat-value">{weekCnt}</div>
        </div>
      </div>

      {/* ── Readiness bar ──────────────────────────────────── */}
      <div className="readiness-card">
        <div className="readiness-header">
          <div className="readiness-label">Role Readiness</div>
          <div className="readiness-pct">{matchPct}%</div>
        </div>
        <div className="readiness-track">
          <div className="readiness-fill" style={{ width: `${barWidth}%` }} />
        </div>
      </div>

      {/* ── Skills you already have ────────────────────────── */}
      {(data.skills_have || []).length > 0 && (
        <div className="skills-have-card">
          <div className="skills-have-label">✅ Skills you already have</div>
          <div className="skills-have-tags">
            {(data.skills_have || []).map(s => (
              <span key={s.name} className="skill-tag">
                <span className="skill-tag-dot" />
                {s.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Skill Gap Report ───────────────────────────────── */}
      {expandedGaps.length > 0 && (
        <>
          <div className="section-heading">
            Skill Gap Report
            {stats.prerequisites_added > 0 && (
              <span className="section-sub">
                {stats.prerequisites_added} prerequisite{stats.prerequisites_added !== 1 ? 's' : ''} auto-added
              </span>
            )}
          </div>
          <div className="skills-list" style={{ marginBottom: 32 }}>
            {expandedGaps.map((gap, i) => (
              <SkillGapRow key={`${gap.skill}-${i}`} gap={gap} />
            ))}
          </div>
        </>
      )}

      {/* ── Personalised Learning Roadmap ──────────────────── */}
      {learningPath.length > 0 && (
        <>
          <div className="section-heading" style={{ marginTop: 32 }}>
            Personalised Learning Roadmap
            <span className="section-sub">
              {stats.total_steps} steps · {stats.total_weeks} weeks · Adapted for {data.experience_level} level
            </span>
          </div>

          {/* Progress tracker */}
          <div className="rdm-progress-card">
            <div className="rdm-progress-top">
              <div className="rdm-progress-title">Learning progress</div>
              <div className="rdm-progress-stats">
                <div className="rdm-ps">
                  <div className="rdm-ps-dot done" />
                  {doneCount} done
                </div>
                <div className="rdm-divider" />
                <div className="rdm-ps">
                  <div className="rdm-ps-dot ip" />
                  {ipCount} in progress
                </div>
                <div className="rdm-divider" />
                <div className="rdm-ps">
                  <div className="rdm-ps-dot todo" />
                  {todoCount} not started
                </div>
              </div>
            </div>
            <div className="rdm-progress-track">
              <div className="rdm-pf-done" style={{ width: `${donePct}%` }} />
              <div className="rdm-pf-ip"   style={{ left: `${donePct}%`, width: `${ipPct}%` }} />
            </div>
            <div className="rdm-weeks-left">
              Remaining: <span>{remWeeks}</span> weeks
            </div>
          </div>

          {/* Node list */}
          <div className="roadmap">
            {learningPath.map((step, i) => (
              <RoadmapNode
                key={step.step_number}
                step={step}
                index={i}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </>
      )}

      {/* ── AI Reasoning Trace ─────────────────────────────── */}
      <ReasoningCard
        points={data.reasoning_points || []}
        traceText={data.reasoning_trace}
      />

      <div className="results-divider" />
      <button className="btn-start-over" onClick={onReset}>← Start Over</button>
    </div>
  );
}
