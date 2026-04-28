import json
import os
import sys
from groq import Groq
from dotenv import load_dotenv

sys.stdout.reconfigure(encoding='utf-8')

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

#***********ASK AI************************


def ask_ai(prompt):
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content.strip()

# *************LOAD JSON FILES******************


def load_json(filename):
    with open(filename, "r", encoding="utf-8") as f:
        return json.load(f)

#**************KILL GAP ANALYSIS*****************

def analyze_skill_gap(resume_data, jd_data):
    resume_skills = resume_data.get("skills", [])
    jd_required = jd_data.get("required_skills", [])
    jd_preferred = jd_data.get("preferred_skills", [])

    candidate_level = resume_data.get(
        "scoring_summary", {}
    ).get("level", "unknown")
    job_level = jd_data.get(
        "experience_needed", {}
    ).get("level", "unknown")

    prompt = f"""
    You are an expert career counselor with 20 years experience.
    
    Analyze the skill gap between this candidate and job requirement.
    
    CANDIDATE SKILLS: {resume_skills}
    CANDIDATE LEVEL: {candidate_level}
    
    JOB REQUIRED SKILLS: {jd_required}
    JOB PREFERRED SKILLS: {jd_preferred}
    JOB REQUIRED LEVEL: {job_level}
    
    Do this analysis:
    
    1. MATCHING SKILLS - skills candidate has that job needs
    2. MISSING REQUIRED SKILLS - must-have skills candidate lacks
    3. MISSING PREFERRED SKILLS - nice-to-have skills candidate lacks
    4. LEVEL MATCH - does candidate level match job level?
    5. OVERALL MATCH SCORE - percentage of how well candidate fits
    6. For each MISSING skill, suggest ONE specific course with:
       - Course name
       - Platform (Udemy/Coursera/YouTube/etc)
       - Estimated time to learn
    
    Return ONLY this JSON:
    {{
        "matching_skills": ["skill1", "skill2"],
        "missing_required_skills": ["skill1", "skill2"],
        "missing_preferred_skills": ["skill1", "skill2"],
        "level_analysis": {{
            "candidate_level": "junior",
            "job_required_level": "mid",
            "is_match": false,
            "comment": "one line explanation"
        }},
        "match_score": 75,
        "match_verdict": "Good Match or Partial Match or Poor Match",
        "courses": [
            {{
                "skill": "AWS",
                "course_name": "AWS Certified Cloud Practitioner",
                "platform": "Udemy",
                "duration": "20 hours"
            }}
        ],
        "overall_advice": "2-3 lines of career advice for this candidate"
    }}
    
    Be honest and realistic in your assessment.
    Return ONLY the JSON. No explanation. No markdown.
    """
    result = ask_ai(prompt)
    result = result.replace("```json", "").replace("```", "").strip()
    return json.loads(result)

#************PRINT RESULTS********************8

def print_gap_results(data):
    print("\n" + "="*50)
    print("         SKILL GAP ANALYSIS REPORT")
    print("="*50)

    # match score
    score = data['match_score']
    verdict = data['match_verdict']
    print(f"\n MATCH SCORE  : {score}%")
    print(f" VERDICT      : {verdict}")

    # level analysis
    print(f"\n LEVEL ANALYSIS")
    level = data['level_analysis']
    # level is shortcut for data['level_analysis']
    print(f"   Candidate Level : {level['candidate_level'].upper()}")
    print(f"   Job Needs Level : {level['job_required_level'].upper()}")
    # show checkmark if match, cross if not
    match_icon = "✅" if level['is_match'] else "❌"
    print(f"   Level Match     : {match_icon}")
    print(f"   Comment         : {level['comment']}")

    # matching skills - good news!
    print(f"\n ✅ SKILLS YOU HAVE ({len(data['matching_skills'])}):")
    for skill in data['matching_skills']:
        print(f"   ✓ {skill}")

    # missing required skills
    print(f"\n ❌ MISSING REQUIRED SKILLS ({len(data['missing_required_skills'])}):")
    for skill in data['missing_required_skills']:
        print(f"   ✗ {skill}")

    # missing preferred skills
    print(f"\n ⚠️  MISSING PREFERRED SKILLS ({len(data['missing_preferred_skills'])}):")
    for skill in data['missing_preferred_skills']:
        print(f"   ~ {skill}")

    # course recommendations
    print(f"\n 📚 RECOMMENDED COURSES:")
    for course in data['courses']:
        print(f"\n   Skill    : {course['skill']}")
        print(f"   Course   : {course['course_name']}")
        print(f"   Platform : {course['platform']}")
        print(f"   Duration : {course['duration']}")

    # overall advice from AI
    print(f"\n 💡 CAREER ADVICE:")
    print(f"   {data['overall_advice']}")

    print("\n" + "="*50)

#*************RUN EVERYTHING****************

resume_data = load_json("resume_output.json")
jd_data = load_json("jd_output.json")
gap_data = analyze_skill_gap(resume_data, jd_data)

print_gap_results(gap_data)

with open("gap_output.json", "w", encoding="utf-8") as f:
    json.dump(gap_data, f, indent=2, ensure_ascii=False)

print("\n Gap analysis saved to gap_output.json ✓")