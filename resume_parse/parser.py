import pdfplumber
import time
from groq import Groq
import os
from dotenv import load_dotenv
import json
import sys                                                
sys.stdout.reconfigure(encoding='utf-8') 
load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

#************READ PDF****************#

def read_pdf(filename):
   with pdfplumber.open(filename)as pdf:
      text=""
      for page in pdf.pages:
         text += page.extract_text()
      return text.encode("utf-8", errors="ignore").decode("utf-8")
   
#********AKING API***********#

def ask_ai(prompt):
   response = client.chat.completions.create(
      model="llama-3.3-70b-versatile",
      messages=[{"role": "user", "content": prompt}]
   )
   return response.choices[0].message.content.strip()

#*******RESUME ANALYSER*****************#

def parse_resume(resume_text):
   prompt = f"""
   You are an expert HR analyst with 25 years experience.
   Analyze this resume and return ONLY a JSON object.

   SCORING RULES(be strict,context matters):

   EXPERIENCE POINTS:
   -Each year at real company = 10 points
   -Each year at internship = 5 points
   -College/university = 2 points

   PROJECT POINTS (per project):
   -Has real users/scales mentioned = 15 points
   -Built for real company = 10points
   -Personal project (no scale) = 5 points
   -Hackethon = 2 points 

   LEADERSHIP POINTS:
    - Led team at real company for 1+ year = 15 points
    - Led team at internship = 7 points
    - Led college team/hackathon = 1 point (not real leadership)

   
    LEVEL FROM TOTAL SCORE:
    - 0 to 10 = fresher
    - 11 to 25 = junior
    - 26 to 45 = mid
    - 46+ = senior

      Return this EXACT JSON:
    {{
        "name": "full name",
        "email": "email or null",
        "skills": ["skill1", "skill2"],
        "experience": {{
            "total_years": 3,
            "breakdown": [
                {{
                    "company": "company name",
                    "role": "job title",
                    "type": "real_company or internship or college",
                    "duration_years": 1.5,
                    "points": 15
                }}
            ],
            "total_experience_points": 25
        }},
        "projects": [
            {{
                "name": "project name",
                "type": "real_company or personal or college",
                "description": "what it does",
                "scale": "number of users or null",
                "technologies": ["tech1", "tech2"],
                "points": 10
            }}
        ],
        "total_project_points": 20,
        "leadership": {{
            "has_leadership": true,
            "details": [
                {{
                    "where": "company or college name",
                    "type": "real_company or internship or college",
                    "team_size": 5,
                    "points": 15
                }}
            ],
            "total_leadership_points": 15
        }},
        "scoring_summary": {{
            "experience_points": 25,
            "project_points": 20,
            "leadership_points": 15,
            "total_points": 60,
            "level": "senior",
            "level_reason": "one line explanation of why this level"
        }}
    }}

    Be STRICT about context:
    - "Led college hackathon team" = college type = 1 point only
    - "Led engineering team at Amazon" = real company = 15 points
    - "Built app for class" = college = 2 points
    - "App with 10k users" = real scale = 15 points

    Resume to analyze:
    {resume_text}

    Return ONLY the JSON. No explanation. No markdown.
    """

   result = ask_ai(prompt)
   result = result.replace("```json", "").replace("```", "").strip()
   return json.loads(result)


#**************PRINT RESULTS********************#

def print_results(data):
   print("\n" + "="*45)
   print("        RESUME ANALYSIS REPORT")
   print("="*45)
   print(f"\n Name    : {data['name']}")
   print(f" Email   : {data['email']}")

   print(f"\n EXPERIENCE")

   print(f"   Total Years : {data['experience']['total_years']}")

   for job in data['experience']['breakdown']:
        
        print(f"   → {job['role']} at {job['company']}")
        print(f"     Type     : {job['type']}")
        print(f"     Duration : {job['duration_years']} years")
        print(f"     Points   : {job['points']}")

   print(f"\n PROJECTS")
   
   for project in data['projects']:

        print(f"   → {project['name']}")
        print(f"     Type  : {project['type']}")
        print(f"     Scale : {project['scale']}")
        print(f"     Tech  : {', '.join(project['technologies'])}")
        print(f"     Points: {project['points']}")
   
   print(f"\n LEADERSHIP")

   if data['leadership']['has_leadership']:
      for lead in data['leadership']['details']:
         print(f"   → Led team of {lead['team_size']} at {lead['where']}")
         print(f"     Type   : {lead['type']}")
         print(f"     Points : {lead['points']}")
   else:
      print("   No leadership experience found")
  
   #**************FINAL SCORE SECTION*******************#
   print(f"\n FINAL SCORE")
   score = data['scoring_summary']
   print(f"   Experience Points : {score['experience_points']}")
   print(f"   Project Points    : {score['project_points']}")
   print(f"   Leadership Points : {score['leadership_points']}")
   print(f"   ─────────────────────")
   print(f"   TOTAL POINTS      : {score['total_points']}")
   print(f"\n LEVEL  : {score['level'].upper()}")
   print(f" REASON : {score['level_reason']}")
   print("\n" + "="*45)

resume_text=read_pdf("Resume_81.pdf")
resume_data = parse_resume(resume_text)
print_results(resume_data)

with open("resume_output.json", "w", encoding="utf-8") as f:
    json.dump(resume_data, f, indent=2, ensure_ascii=False)

print("\n Resume data saved to resume_output.json ✓")

   
