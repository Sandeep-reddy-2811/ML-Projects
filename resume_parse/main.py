import json
import os
import sys
from groq import Groq
from dotenv import load_dotenv
import pdfplumber

sys.stdout.reconfigure(encoding='utf-8')
load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))


# =============================================
# ALL FUNCTIONS IN ONE FILE
# =============================================

def read_pdf(filename):
    with pdfplumber.open(filename) as pdf:
        text = ""
        for page in pdf.pages:
            text += page.extract_text()
    return text.encode("utf-8", errors="ignore").decode("utf-8")


def read_txt(filename):
    with open(filename, "r", encoding="utf-8") as f:
        return f.read()


def ask_ai(prompt):
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content.strip()


def parse_resume(resume_text):
    prompt = f"""
    You are an expert HR analyst with 25 years experience.
    Analyze this resume and return ONLY a JSON object.

    SCORING RULES:
    - Each year at real company = 10 points
    - Each year at internship = 5 points
    - College/university = 0 points
    - Real project with users = 15 points
    - Personal project = 5 points
    - College project = 2 points
    - Led team at real company = 15 points
    - Led team at internship = 7 points
    - Led college team = 1 point

    LEVEL FROM SCORE:
    - 0-10 = fresher
    - 11-25 = junior
    - 26-45 = mid
    - 46+ = senior

    Return ONLY this JSON:
    {{
        "name": "full name",
        "email": "email or null",
        "skills": ["skill1", "skill2"],
        "experience": {{
            "total_years": 0,
            "breakdown": [
                {{
                    "company": "name",
                    "role": "title",
                    "type": "real_company or internship or college",
                    "duration_years": 0,
                    "points": 0
                }}
            ]
        }},
        "projects": [
            {{
                "name": "project name",
                "type": "real_company or personal or college",
                "scale": "users or null",
                "technologies": ["tech1"],
                "points": 0
            }}
        ],
        "leadership": {{
            "has_leadership": false,
            "details": []
        }},
        "scoring_summary": {{
            "experience_points": 0,
            "project_points": 0,
            "leadership_points": 0,
            "total_points": 0,
            "level": "fresher",
            "level_reason": "reason here"
        }}
    }}

    Resume:
    {resume_text}

    Return ONLY JSON. No explanation. No markdown.
    """
    result = ask_ai(prompt)
    result = result.replace("```json", "").replace("```", "").strip()
    return json.loads(result)


def parse_jd(jd_text):
    prompt = f"""
    You are an expert HR analyst.
    Analyze this job description and return ONLY a JSON object.

    Return ONLY this JSON:
    {{
        "job_title": "title or null",
        "company": "company or null",
        "required_skills": ["skill1", "skill2"],
        "preferred_skills": ["skill1"],
        "experience_needed": {{
            "min_years": 0,
            "max_years": 0,
            "level": "fresher or junior or mid or senior"
        }},
        "tech_stack": ["tech1"],
        "responsibilities": ["resp1"],
        "education": "requirement or null",
        "job_type": "full-time or null"
    }}

    For level - NEVER return null, always guess from context:
    - 0-1 years or fresh graduate = fresher
    - 1-3 years = junior
    - 3-6 years = mid
    - 6+ years or lead or architect = senior

    Job Description:
    {jd_text}

    Return ONLY JSON. No explanation. No markdown.
    """
    result = ask_ai(prompt)
    result = result.replace("```json", "").replace("```", "").strip()
    return json.loads(result)


def analyze_gap(resume_data, jd_data):
    resume_skills = resume_data.get("skills", [])
    jd_required = jd_data.get("required_skills", [])
    jd_preferred = jd_data.get("preferred_skills", [])
    candidate_level = resume_data.get("scoring_summary", {}).get("level", "unknown")
    job_level = jd_data.get("experience_needed", {}).get("level", "unknown")

    prompt = f"""
    You are an expert career counselor.

    CANDIDATE SKILLS: {resume_skills}
    CANDIDATE LEVEL: {candidate_level}
    JOB REQUIRED SKILLS: {jd_required}
    JOB PREFERRED SKILLS: {jd_preferred}
    JOB LEVEL: {job_level}

    Return ONLY this JSON:
    {{
        "matching_skills": ["skill1"],
        "missing_required_skills": ["skill1"],
        "missing_preferred_skills": ["skill1"],
        "level_analysis": {{
            "candidate_level": "junior",
            "job_required_level": "mid",
            "is_match": false,
            "comment": "explanation"
        }},
        "match_score": 75,
        "match_verdict": "Good Match or Partial Match or Poor Match",
        "courses": [
            {{
                "skill": "skill name",
                "course_name": "course title",
                "platform": "Udemy or Coursera or YouTube",
                "duration": "X hours"
            }}
        ],
        "overall_advice": "2-3 lines of advice"
    }}

    Return ONLY JSON. No explanation. No markdown.
    """
    result = ask_ai(prompt)
    result = result.replace("```json", "").replace("```", "").strip()
    return json.loads(result)


# =============================================
# PRINT FUNCTIONS
# =============================================

def print_resume(data):
    score = data['scoring_summary']
    print("\n" + "="*50)
    print("          RESUME ANALYSIS")
    print("="*50)
    print(f"\n Name       : {data['name']}")
    print(f" Email      : {data['email']}")
    print(f" Level      : {score['level'].upper()}")
    print(f" Points     : {score['total_points']}")
    print(f" Reason     : {score['level_reason']}")
    print(f"\n Skills     : {', '.join(data['skills'])}")
    print("="*50)


def print_jd(data):
    print("\n" + "="*50)
    print("        JOB DESCRIPTION ANALYSIS")
    print("="*50)
    print(f"\n Job Title  : {data['job_title']}")
    print(f" Company    : {data['company']}")
    exp = data['experience_needed']
    level = exp['level'] if exp['level'] else "Not specified"
    print(f" Level Need : {level.upper()}")
    print(f"\n Required Skills : {', '.join(data['required_skills'])}")
    print("="*50)


def print_gap(data):
    print("\n" + "="*50)
    print("        SKILL GAP ANALYSIS")
    print("="*50)
    print(f"\n MATCH SCORE : {data['match_score']}%")
    print(f" VERDICT     : {data['match_verdict']}")

    print(f"\n ✅ YOU HAVE ({len(data['matching_skills'])}):")
    for s in data['matching_skills']:
        print(f"   ✓ {s}")

    print(f"\n ❌ YOU NEED ({len(data['missing_required_skills'])}):")
    for s in data['missing_required_skills']:
        print(f"   ✗ {s}")

    print(f"\n 📚 COURSES TO TAKE:")
    for c in data['courses']:
        print(f"\n   → {c['skill']}")
        print(f"     Course   : {c['course_name']}")
        print(f"     Platform : {c['platform']}")
        print(f"     Duration : {c['duration']}")

    print(f"\n 💡 ADVICE : {data['overall_advice']}")
    print("\n" + "="*50)


# =============================================
# MAIN - RUN EVERYTHING
# =============================================

print("\n🚀 AI Adaptive Onboarding Engine Starting...")
print("="*50)

# Step 1: Read resume
print("\n[1/5] Reading resume PDF...")
resume_text = read_pdf("Resume_81.pdf")
print("      ✓ Resume read successfully")

# Step 2: Parse resume
print("\n[2/5] Analyzing resume with AI...")
resume_data = parse_resume(resume_text)
print("      ✓ Resume analyzed")

# Step 3: Read job description
print("\n[3/5] Reading job description...")
jd_text = read_txt("job_description.txt")
print("      ✓ Job description read")

# Step 4: Parse JD
print("\n[4/5] Analyzing job description with AI...")
jd_data = parse_jd(jd_text)
print("      ✓ Job description analyzed")

# Step 5: Skill gap analysis
print("\n[5/5] Running skill gap analysis...")
gap_data = analyze_gap(resume_data, jd_data)
print("      ✓ Gap analysis complete")

# Print all results
print_resume(resume_data)
print_jd(jd_data)
print_gap(gap_data)

# Save everything to one final JSON
final_output = {
    "resume": resume_data,
    "job_description": jd_data,
    "skill_gap": gap_data
}

with open("final_output.json", "w", encoding="utf-8") as f:
    json.dump(final_output, f, indent=2, ensure_ascii=False)

print("\n✅ All done! Results saved to final_output.json")
