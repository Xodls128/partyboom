from openai import OpenAI
from django.conf import settings
import json
from datetime import datetime, timedelta

client = OpenAI(api_key=settings.OPENAI_API_KEY)

def generate_party_by_ai(place) -> dict:
    """
    place 객체를 받아 AI가 파티 정보를 JSON으로 생성.
    """
    prompt = f"""
    국민대 근처의 장소 "{place.name}"에서 열릴 수 있는 파티를 만들어줘.
    장소 설명: {place.address}, 수용 인원: {place.capacity}

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
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            response_format={"type": "json_object"},
        )
        data = json.loads(response.choices[0].message.content.strip())
        # 기본값 보정
        return {
            "title": data.get("title", f"{place.name} 파티"),
            "description": data.get("description", ""),
            "start_time": data.get("start_time", (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d %H:%M")),
            "max_participants": data.get("max_participants", place.capacity or 4),
            "tags": data.get("tags", []),
        }
    except Exception as e:
        print(f"[AI 생성 실패]: {e}")
        return {}
