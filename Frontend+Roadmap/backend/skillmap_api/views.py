import json
import anthropic
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

SYSTEM_PROMPT = "You are an expert talent analyst and adaptive learning designer. Return ONLY valid JSON — no markdown, no explanation, no backticks."

ANALYZE_PROMPT = """Analyze this resume and job description. Return ONLY a JSON object with this exact structure:

{
  "candidate_name": "string",
  "years_experience": number,
  "current_title": "string or null",
  "experience_level": "Beginner|Intermediate|Advanced",
  "role_title": "string (from JD)",
  "summary": "2 sentence professional summary",
  "skills_have": [{"name": "string", "level": "beginner|intermediate|advanced"}],
  "skills_gap": [{"name": "string", "required_level": "beginner|intermediate|advanced", "priority": "high|medium|low", "reason": "why this is needed"}],
  "skills_partial": [{"name": "string", "current_level": "beginner|intermediate|advanced", "required_level": "beginner|intermediate|advanced", "reason": "what needs improvement"}],
  "match_percent": number,
  "roadmap": [
    {
      "title": "string",
      "description": "2-3 sentences tailored to the candidate level",
      "priority": "high|medium|low",
      "duration_weeks": number,
      "skill_name": "string",
      "tags": ["string"]
    }
  ]
}

Rules:
- experience_level: Beginner=0-1yr, Intermediate=2-4yr, Advanced=5+yr
- Roadmap ordered by priority, adapted to experience_level
- Beginners: include fundamentals; Advanced: skip basics, focus on advanced topics
- match_percent: honest realistic assessment

RESUME:
{resume}

JOB DESCRIPTION:
{jd}"""


@api_view(['GET'])
def health(request):
    return Response({'status': 'ok', 'service': 'SkillMap API'})


@api_view(['POST'])
def analyze(request):
    resume_text = request.data.get('resume_text', '').strip()
    jd_text     = request.data.get('jd_text', '').strip()

    if not resume_text:
        return Response({'error': 'resume_text is required'}, status=status.HTTP_400_BAD_REQUEST)
    if not jd_text:
        return Response({'error': 'jd_text is required'}, status=status.HTTP_400_BAD_REQUEST)

    api_key = settings.ANTHROPIC_API_KEY
    if not api_key:
        return Response({'error': 'API key not configured'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    try:
        client = anthropic.Anthropic(api_key=api_key)
        message = client.messages.create(
            model='claude-sonnet-4-20250514',
            max_tokens=2500,
            system=SYSTEM_PROMPT,
            messages=[{'role': 'user', 'content': ANALYZE_PROMPT.format(resume=resume_text, jd=jd_text)}]
        )
        raw = message.content[0].text.strip().strip('```json').strip('```').strip()
        result = json.loads(raw)
        return Response(result, status=status.HTTP_200_OK)

    except json.JSONDecodeError as e:
        return Response({'error': f'Failed to parse response: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except anthropic.AuthenticationError:
        return Response({'error': 'Invalid API key'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
