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

BASE_URL = "http://127.0.0.1:8000"

def create_test_places():
    """테스트용 장소 데이터를 생성하거나 확인합니다."""
    from detailview.models import Place
    
    places_to_create = [
        {'name': '국민대 정문', 'address': '서울 성북구 정릉로 77', 'latitude': 37.6102, 'longitude': 126.997, 'capacity': 15},
        {'name': '길음역 근처', 'address': '서울 성북구 길음로 7', 'latitude': 37.6033, 'longitude': 127.025, 'capacity': 20},
        {'name': '성신여대입구역 로데오거리', 'address': '서울 성북구 동소문로20길', 'latitude': 37.5919, 'longitude': 127.016, 'capacity': 25}
    ]
    
    created_count = 0
    for place_data in places_to_create:
        # update_or_create를 사용하여 조회와 생성을 명확히 분리
        defaults = {
            "address": place_data.get("address"),
            "latitude": place_data.get("latitude"),
            "longitude": place_data.get("longitude"),
            "capacity": place_data.get("capacity"),
        }
        _, created = Place.objects.update_or_create(
            name=place_data.get("name"), 
            defaults=defaults
        )

        if created:
            created_count += 1
    
    print(f"✅ 성공: 총 {len(places_to_create)}개의 장소 중 {created_count}개를 새로 생성했습니다.")

def create_parties_for_all_places(token):
    """DB에 있는 모든 장소에 대해 AI 파티 생성을 요청합니다."""
    from detailview.models import Place

    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    places = Place.objects.all()
    if not places:
        print("❌ 실패: DB에 장소가 없습니다. create_test_places()가 먼저 실행되었는지 확인하세요.")
        return

    print(f"총 {len(places)}개의 장소에 대해 AI 파티 생성을 시작합니다.")
    for place in places:
        payload = {"place_id": place.id}
        try:
            response = requests.post(f"{BASE_URL}/api/detailview/party/ai-create/", headers=headers, json=payload)
            response.raise_for_status()
            party_id = response.json().get("party_id")
            print(f"  - '{place.name}': AI 파티 생성 성공 (Party ID: {party_id})")
        except requests.exceptions.RequestException as e:
            print(f"  - '{place.name}': AI 파티 생성 실패. 에러: {e}")
            if e.response:
                print(f"    서버 응답: {e.response.text}")

def get_auth_token():
    """테스트용 인증 토큰을 발급받습니다."""
    try:
        response = requests.post(f"{BASE_URL}/api/signup/auth/kakao/", json={})
        response.raise_for_status()
        access_token = response.json().get("access")
        if not access_token:
            print("❌ 실패: 응답에 access 토큰이 없습니다.")
            return None
        print("✅ 성공: Access Token을 성공적으로 발급받았습니다.")
        return access_token
    except requests.exceptions.RequestException as e:
        print(f"❌ 실패: 토큰 발급 중 에러 발생: {e}")
        print("   - 확인 사항: Django 서버가 실행 중인지, `ENABLE_AUTH = False` 설정이 되어있는지 확인하세요.")
        return None

if __name__ == "__main__":
    setup_django()
    if ensure_user_is_active():
        print("="*50)
        print("프론트엔드 테스트를 위한 AI 파티 대량 생성을 시작합니다.")
        print("="*50)
        
        print("\n--- 1단계: 테스트용 장소 데이터 생성 ---")
        create_test_places()
        
        print("\n--- 2단계: 인증 토큰 발급 ---")
        token = get_auth_token()

        if token:
            print("\n--- 3단계: 모든 장소에 대해 AI 파티 생성 ---")
            create_parties_for_all_places(token)
            print("\n✅✅✅ 모든 테스트가 완료되었습니다.")
        else:
            print("\n❌ 최종 실패: 인증 토큰을 발급받지 못해 테스트를 중단합니다.")
