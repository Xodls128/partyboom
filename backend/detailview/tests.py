from unittest.mock import patch
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone
import datetime

from .models import Place, Party, Tag

User = get_user_model()


class AIPartyCreateAPITest(APITestCase):

    @classmethod
    def setUpTestData(cls):
        """모든 테스트에서 재사용할 고정 데이터 생성 (성능 향상)"""
        cls.user = User.objects.create_user(username='testuser', password='password123')
        cls.place = Place.objects.create(name='테스트 장소', capacity=10)

    def setUp(self):
        """테스트마다 초기화되는 값들"""
        self.url = reverse('detailview:ai-party-create')

    def _auth_post(self, data: dict):
        self.client.force_authenticate(user=self.user)
        return self.client.post(self.url, data, format='json')

    @patch('detailview.views.generate_party_by_ai')  # 모킹할 대상 함수 경로
    def test_ai_party_creation_success(self, mock_generate_party_by_ai):
        """AI 파티 생성 성공 케이스"""
        fake_ai_response = {
            "title": "AI가 생성한 멋진 파티",
            "description": "정말 신나는 파티가 될 거예요!",
            "start_time": timezone.now() + datetime.timedelta(days=7),
            "max_participants": 8,
            "tags": ["#EDM", "#코딩"],
        }
        mock_generate_party_by_ai.return_value = fake_ai_response

        response = self._auth_post({"place_id": self.place.id})

        # 1) 응답 검증
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('message'), "AI 파티 생성 완료")

        # 2) DB 생성 검증
        self.assertTrue(Party.objects.filter(title="AI가 생성한 멋진 파티").exists())
        party = Party.objects.get(title="AI가 생성한 멋진 파티")
        self.assertEqual(party.place, self.place)
        self.assertEqual(party.max_participants, 8)

        # 3) 태그 생성 및 연결 검증
        self.assertTrue(Tag.objects.filter(name="#EDM").exists())
        self.assertTrue(Tag.objects.filter(name="#코딩").exists())
        self.assertEqual(party.tags.count(), 2)

        # 4) 모킹 함수 호출 검증
        mock_generate_party_by_ai.assert_called_once_with(self.place.name)

    @patch('detailview.views.generate_party_by_ai')
    def test_ai_party_creation_failure(self, mock_generate_party_by_ai):
        """AI 응답 실패 케이스 (None 반환)"""
        mock_generate_party_by_ai.return_value = None

        response = self._auth_post({"place_id": self.place.id})

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(response.data.get('error'), "AI 응답 실패")
        self.assertFalse(Party.objects.exists())

    @patch('detailview.views.generate_party_by_ai')
    def test_ai_party_creation_with_invalid_place(self, mock_generate_party_by_ai):
        """유효하지 않은 place_id로 요청 시 400 또는 404를 기대 (뷰 구현에 따라 다를 수 있음)"""
        mock_generate_party_by_ai.return_value = {
            "title": "제목",
            "description": "설명",
            "start_time": timezone.now() + datetime.timedelta(days=1),
            "max_participants": 4,
            "tags": ["#테스트"],
        }

        invalid_place_id = 999999
        response = self._auth_post({"place_id": invalid_place_id})

        # 구현에 따라 400(Bad Request) 또는 404(Not Found) 중 하나를 선택해 사용한다.
        self.assertIn(response.status_code, {status.HTTP_400_BAD_REQUEST, status.HTTP_404_NOT_FOUND})
        self.assertFalse(Party.objects.exists())

    def test_ai_party_creation_unauthenticated(self):
        """비인증 사용자는 접근 불가(401/403)"""
        response = self.client.post(self.url, {"place_id": self.place.id}, format='json')
        self.assertIn(response.status_code, {status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN})
        self.assertFalse(Party.objects.exists())
        