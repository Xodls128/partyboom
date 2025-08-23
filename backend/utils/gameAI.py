from openai import OpenAI
from django.conf import settings
import json, re
from datetime import datetime

client = OpenAI(api_key=settings.OPENAI_API_KEY) # 최신 버전 설정 방식


MODEL = "gpt-4o-mini"  # 해커톤용 하드코딩(원하면 문자열만 교체)

SYSTEM = """You are a content generator for a Korean social party app.
Return ONLY valid JSON with this schema:
{
  "items": [
    {"a": "string(<=40)", "b": "string(<=40)"}
  ]
}
Rules:
- Korean only.
- No emojis, numbering, quotes, or markdown.
- Keep each option short (<= 40 chars), concrete, and fun.
- Consider place context, start time, headcount, and tags.
- No sexual, hate, violence, illegal, medical, self-harm or political persuasion content.
"""

USER_TMPL = """파티 정보:
- 제목: {title}
- 장소: {place_name}
- 시작시각: {start_time}
- 예상 인원(정원): {max_participants}명
- 태그: {tags}
- 소개: {description}

요청:
- 위 파티의 분위기/시간대/인원/태그 맥락을 반영한 밸런스 게임 문항 {count}쌍을 생성해줘.
- 각 선택지는 40자 이내로 짧고 명확하며 현장감 있게 작성.
- JSON 스키마에 '정확히' 맞춘 JSON만 반환해. 다른 텍스트 절대 포함하지 마.
"""


#내부 유틸 함수
def _clip(s: str, n: int) -> str:
    s = re.sub(r"\s+", " ", str(s or "")).strip()
    return s[:n]

def _clean_items(raw_items, count: int):
    cleaned, seen = [], set()
    for it in raw_items or []:
        a = _clip(it.get("a"), 40)
        b = _clip(it.get("b"), 40)
        if not a or not b or a == b:
            continue
        key = (a, b)
        if key in seen:
            continue
        seen.add(key)
        cleaned.append({"a": a, "b": b})
        if len(cleaned) >= count:
            break
    return cleaned

def _fallback_items(count: int):
    seed = [
        {"a": "돗자리 피크닉", "b": "노을 산책"},
        {"a": "시장 간식 투어", "b": "카페 탐방"},
        {"a": "배드민턴 단판", "b": "피구 한 판"},
        {"a": "보드게임 가볍게", "b": "버스킹 구경"},
        {"a": "잔디 조용한 구역", "b": "분수대 북적이는 곳"},
    ]
    cnt = max(1, min(int(count or 5), 20))
    return seed[:cnt]

def _topoff_with_fallback(items, cnt):
    """모델이 적게 줬을 때 폴백으로 개수 보정"""
    if len(items) >= cnt:
        return items[:cnt]
    need = cnt - len(items)
    tail = _fallback_items(need)
    seen = {(it["a"], it["b"]) for it in items}
    for it in tail:
        key = (it["a"], it["b"])
        if key not in seen:
            items.append(it)
            seen.add(key)
        if len(items) >= cnt:
            break
    return items

def _tag_names(party):
    """
    Tag 모델이 name/label/title 중 무엇을 쓰는지 모르므로 최대한 유연하게 추출.
    """
    names = []
    for t in party.tags.all():
        for field in ("name", "label", "title"):
            if hasattr(t, field):
                names.append(str(getattr(t, field)))
                break
        else:
            names.append(str(t))
    return names

def _place_name(party):
    # Place 모델에 name/title/address 등 어떤 필드가 있을지 몰라서 안전하게 처리
    for field in ("name", "title"):
        if hasattr(party.place, field):
            return str(getattr(party.place, field))
    return str(party.place)

def _fmt_start_time(dt):
    try:
        # "YYYY-MM-DD HH:MM" 포맷으로 맞춤
        return dt.strftime("%Y-%m-%d %H:%M")
    except Exception:
        return str(dt)


# party 인스턴스로부터 생성함 
def generate_balance_by_ai(party, count: int = 5) -> dict:
    """
    Party 인스턴스(제목/설명/태그/장소/시간/정원)를 맥락으로 사용해
    밸런스 게임 문항을 생성해 dict로 반환합니다.
    반환: {"items": [{"a": "...", "b": "..."}, ...]}
    실패해도 폴백으로 count개 보장.
    """
    cnt = max(1, min(int(count or 5), 20))
    title = _clip(getattr(party, "title", ""), 50)
    description = _clip(getattr(party, "description", ""), 160)  # 소개는 160자 정도만 사용
    tags_list = _tag_names(party)
    tags_str = ", ".join(tags_list[:6]) if tags_list else "(태그 없음)"
    place_name = _place_name(party)
    start_time = _fmt_start_time(getattr(party, "start_time", ""))  # DateTimeField
    max_participants = getattr(party, "max_participants", 4)

    prompt = USER_TMPL.format(
        title=title or "파티",
        place_name=place_name,
        start_time=start_time,
        max_participants=max_participants,
        tags=tags_str,
        description=description or "(설명 없음)",
        count=cnt,
    )

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": SYSTEM},
                {"role": "user", "content": prompt},
            ],
            temperature=0.8,
            max_tokens=400,  # 충분
            response_format={"type": "json_object"},
        )
        data = json.loads(response.choices[0].message.content.strip())
        items = _clean_items(data.get("items"), cnt)
        if not items:
            items = _fallback_items(cnt)
        items = _topoff_with_fallback(items, cnt)  # 정확히 cnt개 보장
        return {"items": items}
    except Exception as e:
        # 운영 시엔 logging 사용하는게 좋지만, 해커톤에선 print로 대체
        print(f"[AI 생성 실패]: {e}")
        return {"items": _fallback_items(cnt)}