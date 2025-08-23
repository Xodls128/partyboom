import requests
import json
import os
import django

def setup_django():
    """테스트 스크립트에서 Django 모델을 사용하기 위해 환경을 설정합니다."""
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    django.setup()

def ensure_user_is_active():
    """테스트에 사용될 1번 유저가 활성 상태인지 확인하고, 아니면 활성화합니다."""
    print("--- 0단계: 테스트 사용자 계정 상태 점검 ---")
    from django.contrib.auth import get_user_model
    User = get_user_model()
    try:
        user = User.objects.get(id=1)
        if not user.is_active:
            user.is_active = True
            user.save()
            print("✅ 성공: 1번 사용자를 활성 상태로 변경했습니다.")
        else:
            print("✅ 성공: 1번 사용자가 이미 활성 상태입니다.")
    except User.DoesNotExist:
        print("❌ 실패: 1번 사용자가 DB에 존재하지 않습니다. `python manage.py createsuperuser`로 사용자를 먼저 생성해주세요.")
        return False
    return True


# --- 설정 부분 ---
BASE_URL = "http://127.0.0.1:8000"
PLACE_ID_TO_TEST = 1
# ----------------

def run_test():
    """전체 API 테스트 흐름을 실행하는 메인 함수"""
    access_token = None
    party_id = None

    # --- 1. 테스트용 인증 토큰 발급 ---
    print("\n--- 1단계: 인증 토큰 발급 시도 ---")
    try:
        response = requests.post(f"{BASE_URL}/api/signup/auth/kakao/", json={})
        response.raise_for_status()
        token_data = response.json()
        access_token = token_data.get("access")
        if not access_token:
            print("오류: 응답에 access 토큰이 없습니다.")
            return
        print("✅ 성공: Access Token을 성공적으로 발급받았습니다.")
    except requests.exceptions.RequestException as e:
        print(f"❌ 실패: 토큰 발급 중 에러 발생: {e}")
        print("   - 확인 사항: Django 서버가 실행 중인지, `ENABLE_AUTH = False` 설정이 되어있는지 확인하세요.")
        return

    # --- 2. AI로 파티 생성 ---
    print("\n--- 2단계: AI로 파티 생성 시도 ---")
    try:
        headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
        payload = {"place_id": PLACE_ID_TO_TEST}
        response = requests.post(f"{BASE_URL}/api/detailview/party/ai-create/", headers=headers, json=payload)
        response.raise_for_status()
        party_data = response.json()
        party_id = party_data.get("party_id")
        if not party_id:
            print("오류: 파티 생성 응답에 party_id가 없습니다.")
            return
        print(f"✅ 성공: AI가 파티를 생성했습니다. (새로운 Party ID: {party_id})")
    except requests.exceptions.RequestException as e:
        print(f"❌ 실패: 파티 생성 중 에러 발생: {e}")
        print(f"   - 서버 응답: {e.response.text}")
        return

    # --- 3. 생성된 파티에 AI로 밸런스 게임 생성 ---
    print("\n--- 3단계: 생성된 파티에 AI 밸런스 게임 생성 시도 ---")
    try:
        headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
        payload = {"party_id": party_id, "count": 5}
        response = requests.post(f"{BASE_URL}/api/v1/game/rounds/ai-create/", headers=headers, json=payload)
        response.raise_for_status()
        game_data = response.json()
        print("✅✅✅ 최종 성공! AI가 밸런스 게임을 성공적으로 생성했습니다.")
        print("\n--- 최종 생성된 게임 데이터 ---")
        print(json.dumps(game_data, indent=2, ensure_ascii=False))
    except requests.exceptions.RequestException as e:
        print(f"❌ 실패: 밸런스 게임 생성 중 에러 발생: {e}")
        print(f"   - 서버 응답: {e.response.text}")
        return

if __name__ == "__main__":
    setup_django()
    if ensure_user_is_active():
        run_test()