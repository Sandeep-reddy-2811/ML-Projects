const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export async function analyzeProfile(resumeText, jdText, onStatus, onStreamLine) {
  let apiKey = '';
  try { apiKey = localStorage.getItem('sm_api_key') || ''; } catch {}

  if (!apiKey) {
    throw new Error('No API key found. Click the ⚙ settings icon to add your Anthropic API key.');
  }

  onStatus('Parsing your profile…', 'Extracting skills and experience level');
  onStreamLine('Connecting to Claude API…');
  await sleep(300);

  onStatus('Analyzing job requirements…', 'Comparing your profile against the role');
  onStreamLine('Sending resume + JD to Claude…');

  const prompt = `You are an expert career coach and skills analyst. Analyze the resume and job description below, then return a JSON object with the EXACT structure shown. Return ONLY valid JSON — no markdown fences, no preamble.

{
  "candidate_name": "string",
  "years_experience": number,
  "experience_level": "Beginner" | "Intermediate" | "Advanced",
  "summary": "one sentence summary of candidate fit",
  "current_title": "string or null",
  "skills_have": [
    { "name": "string", "level": "beginner | intermediate | advanced" }
  ],
  "match_percent": number (0–100),
  "job_title": "string",
  "summary_stats": {
    "original_gaps": number,
    "prerequisites_added": number,
    "total_steps": number,
    "total_weeks": number,
    "skill_gap_summary": "one sentence"
  },
  "skill_gaps": [
    { "skill": "string", "current_level": 0–3, "required_level": 0–3, "gap_size": number }
  ],
  "expanded_gaps": [
    { "skill": "string", "current_level": 0–3, "required_level": 0–3, "gap_size": number, "auto_added": boolean }
  ],
  "learning_path": [
    {
      "step_number": number,
      "course_title": "string",
      "skill": "string",
      "level": "beginner | intermediate | expert",
      "duration_weeks": number,
      "link": "real Coursera / fast.ai / official docs URL",
      "reason": "1–2 sentences why this step",
      "tags": ["tag1", "tag2"]
    }
  ],
  "reasoning_points": [
    {
      "icon": "🔴 | 🟡 | 🟣",
      "iconClass": "high | auto | med",
      "title": "Skill — priority label",
      "body": "2–3 sentence explanation",
      "badge": "Gap: X levels · Y steps needed",
      "badgeClass": "red | grn | pur"
    }
  ],
  "reasoning_trace": "full paragraph explaining the overall learning path logic"
}

Rules:
- skills_have: only clearly demonstrated skills
- expanded_gaps: original gaps PLUS auto-added prerequisites (auto_added: true)
- learning_path tags: e.g. ["Core skill","Beginner"], ["Prerequisite","Foundational"], ["Partial skill","Intermediate"]
- reasoning_points: 3–5 items; 🔴 iconClass "high" for big gaps, 🟡 "auto" for prerequisites, 🟣 "med" for partial gaps
- badgeClass: "red" for gaps, "grn" for auto-added/positive, "pur" for medium/partial
- links: use real URLs from Coursera, fast.ai, PyTorch docs, official docs, etc.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jdText}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${response.status}`);
  }

  onStreamLine('Receiving analysis from Claude…');
  onStatus('Building your learning path…', 'Generating personalised roadmap');
  await sleep(200);

  const raw = await response.json();
  const text = (raw.content || []).map(b => b.text || '').join('');

  onStreamLine('Parsing skill gaps and roadmap…');

  let parsed;
  try {
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    parsed = JSON.parse(clean);
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) parsed = JSON.parse(m[0]);
    else throw new Error("Could not parse Claude's response as JSON.");
  }

  onStreamLine('Analysis complete ✓');
  return parsed;
}
