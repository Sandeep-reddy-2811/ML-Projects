import sys
import os
import json
from groq import Groq
from dotenv import load_dotenv

sys.stdout.reconfigure(encoding='utf-8')

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ***************ASK AI*******************

def ask_ai(prompt):
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile", 
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content.strip()


# ************** PARSE JOB DESCRIPTION**************


def parse_jd(jd_text):
    prompt = f"""
    You are an expert HR analyst with 25 years experience.
    Analyze this job description carefully and return ONLY a JSON object.

    Extract the following:

    1. REQUIRED SKILLS - skills the job explicitly requires
    2. PREFERRED SKILLS - skills that are "nice to have"
    3. EXPERIENCE NEEDED - how many years they want
    4. LEVEL - what seniority level they want
    5. RESPONSIBILITIES - main things the person will do
    6. TECH STACK - specific technologies mentioned

    Return this EXACT JSON:
    {{
        "job_title": "exact job title",
        "company": "company name or null",
        "required_skills": ["skill1", "skill2", "skill3"],
        "preferred_skills": ["skill1", "skill2"],
        "experience_needed": {{
            "min_years": 2,
            "max_years": 5,
            "level": "junior or mid or senior"
        }},
        "tech_stack": ["Python", "AWS", "Docker"],
        "responsibilities": [
            "responsibility 1",
            "responsibility 2"
        ],
        "education": "degree requirement or null",
        "job_type": "full-time or part-time or contract"
    }}

    Be thorough - extract EVERY skill and technology mentioned.
    If something is not mentioned, use null.

    Job Description to analyze:
    {jd_text}

    Return ONLY the JSON. No explanation. No markdown.
    """
    result = ask_ai(prompt)
    result = result.replace("```json", "").replace("```", "").strip()
    return json.loads(result)



#*************PRINT JD RESULTS***********

def print_jd_results(data):
    # print header
    print("\n" + "="*45)
    print("        JOB DESCRIPTION ANALYSIS")
    print("="*45)

    # job title and company
    print(f"\n Job Title : {data['job_title']}")
    print(f" Company   : {data['company']}")
    print(f" Job Type  : {data['job_type']}")

    # experience section
    print(f"\n EXPERIENCE NEEDED")
    exp = data['experience_needed']
    print(f"   Min Years : {exp['min_years']}")
    print(f"   Max Years : {exp['max_years']}")
    level = exp['level'] if exp['level'] else "Not specified"
    print(f"   Level     : {level.upper()}")
    print(f"\n REQUIRED SKILLS (must have):")
    for skill in data['required_skills']:
        print(f"   → {skill}")
    print(f"\n PREFERRED SKILLS (nice to have):")
    for skill in data['preferred_skills']:
        print(f"   → {skill}")
    print(f"\n TECH STACK:")
    for tech in data['tech_stack']:
        print(f"   → {tech}")
    print(f"\n RESPONSIBILITIES:")
    for resp in data['responsibilities']:
        print(f"   → {resp}")
    print(f"\n Education : {data['education']}")
    print("\n" + "="*45)



#**********RUN EVERYTHING***************

with open("job_description.txt", "r", encoding="utf-8") as f:
    jd_text = f.read()
jd_data = parse_jd(jd_text)
print_jd_results(jd_data)
with open("jd_output.json", "w", encoding="utf-8") as f:
    json.dump(jd_data, f, indent=2, ensure_ascii=False)

print("\n JD data saved to jd_output.json ✓")
