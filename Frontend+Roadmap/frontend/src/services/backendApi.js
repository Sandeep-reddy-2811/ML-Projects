const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health/`);
    return res.ok;
  } catch {
    return false;
  }
}

function transformResponse(raw) {
  const {
    candidate_name   = 'Candidate',
    experience_years = 0,
    experience_level = 'mid',
    job_title        = 'Target Role',
    candidate_skills = [],
    required_skills  = [],
    skill_gaps       = [],
    learning_path    = [],
    reasoning_trace  = '',
    summary          = {},
  } = raw;

  // ── Sanitize — ensure all skills arrays contain only strings ─
  const cleanCandidateSkills = candidate_skills.filter(s => typeof s === 'string');
  const cleanRequiredSkills  = required_skills.filter(s => typeof s === 'string');
  const cleanSkillGaps       = skill_gaps.filter(s => typeof s === 'string');

  // ── skills_have ───────────────────────────────────────────
  const skills_have = cleanCandidateSkills.map(name => ({
    name,
    level: 'intermediate',
  }));

  // ── match_percent ─────────────────────────────────────────
  const total         = cleanRequiredSkills.length || 1;
  const matchedCount  = cleanRequiredSkills.filter(s =>
    cleanCandidateSkills.map(c => c.toLowerCase()).includes(s.toLowerCase())
  ).length;
  const match_percent = Math.round((matchedCount / total) * 100);

  // ── skill_gaps — strings → structured objects ─────────────
  const structuredGaps = cleanSkillGaps.map(skill => ({
    skill,
    current_level:  0,
    required_level: 3,
    gap_size:       3,
    auto_added:     false,
  }));

  // ── expanded_gaps ─────────────────────────────────────────
  const pathSkills   = [...new Set(learning_path.map(s => s.skill).filter(s => typeof s === 'string'))];
  const gapSkillSet  = new Set(cleanSkillGaps.map(s => s.toLowerCase()));
  const expandedGaps = pathSkills.map(skill => ({
    skill,
    current_level:  0,
    required_level: 3,
    gap_size:       3,
    auto_added:     !gapSkillSet.has(skill.toLowerCase()),
  }));

  // ── learning_path — enrich with tags ─────────────────────
  const enrichedPath = learning_path.map((step, i) => ({
    ...step,
    step_number: step.step_number ?? i + 1,
    tags:        step.tags ?? _inferTags(step),
  }));

  // ── summary_stats ─────────────────────────────────────────
  const summary_stats = {
    original_gaps:       summary.original_gaps       ?? cleanSkillGaps.length,
    prerequisites_added: summary.prerequisites_added ?? 0,
    total_steps:         summary.total_steps         ?? learning_path.length,
    total_weeks:         summary.total_weeks         ?? enrichedPath.reduce((a, s) => a + (s.duration_weeks || 0), 0),
    skill_gap_summary:   summary.skill_gap_summary   ?? `${cleanSkillGaps.length} skill gap(s) identified for ${job_title}.`,
  };

  // ── reasoning_points ─────────────────────────────────────
  const reasoning_points = _deriveReasoningPoints(
    cleanSkillGaps,
    summary_stats.prerequisites_added,
  );

  return {
    candidate_name,
    years_experience: experience_years,
    experience_level: _mapLevel(experience_level),
    current_title:    null,
    summary:          `Candidate with ${experience_years} year(s) experience transitioning into ${job_title}.`,
    skills_have,
    match_percent,
    job_title,
    summary_stats,
    skill_gaps:       structuredGaps,
    expanded_gaps:    expandedGaps,
    learning_path:    enrichedPath,
    reasoning_points,
    reasoning_trace,
  };
}

function _mapLevel(level) {
  const map = { fresher: 'Beginner', mid: 'Intermediate', senior: 'Advanced' };
  return map[level] || 'Intermediate';
}

function _inferTags(step) {
  const lvl    = step.level?.toLowerCase() || '';
  const reason = step.reason?.toLowerCase() || '';
  const tag1   = reason.includes('prerequisite') ? 'Prerequisite' : 'Core skill';
  const tag2   = lvl === 'beginner'     ? 'Beginner'
               : lvl === 'intermediate' ? 'Intermediate'
               : lvl === 'expert'       ? 'Expert'
               : 'Intermediate';
  return [tag1, tag2];
}

function _deriveReasoningPoints(skill_gaps, prereqCount) {
  const points = [];

  skill_gaps.slice(0, 2).forEach(skill => {
    points.push({
      icon:       '🔴',
      iconClass:  'high',
      title:      `${skill} — high priority gap`,
      body:       `This skill is required for the target role and was not found in the candidate's profile.`,
      badge:      'Gap identified · steps added',
      badgeClass: 'red',
    });
  });

  if (prereqCount > 0) {
    points.push({
      icon:       '🟡',
      iconClass:  'auto',
      title:      `${prereqCount} prerequisite(s) auto-added`,
      body:       `The skill graph detected foundational skills needed before tackling the primary gaps.`,
      badge:      `${prereqCount} prerequisites auto-detected`,
      badgeClass: 'grn',
    });
  }

  skill_gaps.slice(2).forEach(skill => {
    points.push({
      icon:       '🟣',
      iconClass:  'med',
      title:      `${skill} — medium priority`,
      body:       `Additional skill gap identified. Addressed in the learning path.`,
      badge:      'Partially addressed',
      badgeClass: 'pur',
    });
  });

  return points;
}

// ── Main export ───────────────────────────────────────────────
export async function analyzeProfile(
  resumeFile, jdFile,
  resumeText, jdText,
  onStatus, onStreamLine
) {
  onStatus('Uploading your documents…', 'Sending to server');
  onStreamLine('Connecting to backend…');
  await sleep(300);

  const formData = new FormData();

  if (resumeFile) formData.append('resume',          resumeFile);
  if (jdFile)     formData.append('job_description', jdFile);

  if (resumeText && resumeText.trim()) formData.append('resume_text', resumeText.trim());
  if (jdText     && jdText.trim())     formData.append('jd_text',     jdText.trim());

  onStreamLine('Sending data to Django…');
  onStatus('Parsing your resume…', 'Extracting skills and experience level');

  let response;
  try {
    response = await fetch(`${API_BASE}/api/analyze/`, {
      method: 'POST',
      body:   formData,
    });
  } catch (networkErr) {
    throw new Error(
      `Cannot reach the backend at ${API_BASE}. ` +
      `Make sure Django is running: python manage.py runserver`
    );
  }

  onStreamLine('Analyzing skill gaps…');
  onStatus('Analyzing job requirements…', 'Comparing your profile against the role');

  if (!response.ok) {
    let errMsg = `Server error ${response.status}`;
    try {
      const errBody = await response.json();
      errMsg = errBody.error || errBody.details || errMsg;
    } catch {}
    throw new Error(errMsg);
  }

  const raw = await response.json();

  onStreamLine('Building personalised learning path…');
  onStatus('Building your learning path…', 'Generating personalised roadmap');
  await sleep(300);

  const transformed = transformResponse(raw);

  onStreamLine('Analysis complete ✓');
  return transformed;
}