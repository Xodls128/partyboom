from openai import OpenAI
from django.conf import settings
import json

# openai.api_key = settings.OPENAI_API_KEY 구버전 설정 방식
client = OpenAI(api_key=settings.OPENAI_API_KEY) # 최신 버전 설정 방식

def generate_party_by_ai(place_name: str) -> dict:
    prompt = f"""
    국민대 근처의 장소 "{place_name}"에서 열릴 수 있는 파티를 만들어줘.
    다음 정보를 JSON 형식으로 응답해줘:
    {{
        "title": "파티 제목",
        "description": "파티에 대한 간단한 설명",
        "start_time": "2025-08-20 18:00",
        "max_participants": 4,
        "tags": ["음악", "친목"]
    }}
    """
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,

        )

        return json.loads(response.choices[0].message.content.strip())
    except Exception as e:
        print(f"[AI 생성 실패]: {e}")
        return {}  # 실패시 빈 dict 반환
