from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from django.db.models import F, Count
from detailview.models import Party, Participation
from .models import Notice

# 1. 파티 오픈 1일 전 알림
@shared_task
def create_party_open_notices():
    now = timezone.now()
    target_start = now + timedelta(hours=23)
    target_end = now + timedelta(hours=25)

    parties = Party.objects.annotate(
        participant_count=Count("participations")
    ).filter(
        start_time__range=(target_start, target_end),
        participant_count=F("max_participants")  # 정원 꽉 찬 경우
    )

    for party in parties:
        participants = Participation.objects.filter(party=party)
        for p in participants:
            Notice.objects.create(
                user=p.user,
                notice_type=Notice.PARTY_OPEN_1DAY,
                message=f"신청하신 '{party.title}'가 곧 열릴 예정이에요. 파티 즐길 준비 됐나요?"
            )


@shared_task
def create_insufficient_party_notices():
    now = timezone.now()
    target_start = now + timedelta(hours=23)
    target_end = now + timedelta(hours=25)
    
    parties = Party.objects.annotate(
        participant_count=Count("participations")
    ).filter(
        start_time__range=(target_start, target_end),
        participant_count__lt=(F("max_participants") * 2 / 3)  # 최소인원 기준
    )

    for party in parties:
        participants = Participation.objects.filter(party=party)
        for p in participants:
            Notice.objects.create(
                user=p.user,
                notice_type=Notice.PARTY_INSUFFICIENT,
                message=f"신청하신 '{party.title}'이(가) 신청 인원 미달로 취소됐어요. 다음에 더 재밌는 자리로 찾아올게요."
            )


# 3. 새 파티 생성 알림
@shared_task
def create_new_party_notice(party_id):
    try:
        party = Party.objects.get(id=party_id)
    except Party.DoesNotExist:
        return

    from django.contrib.auth import get_user_model
    User = get_user_model()

    # host 필드가 없으니까 모든 유저 대상으로 알림 생성
    for user in User.objects.all():
        Notice.objects.create(
            user=user,
            notice_type=Notice.PARTY_NEW,
            message=f"새로운 파티가 열렸어요! '{party.title}'에서 새로운 친구들을 만나보세요."
        )

# 4. 파티 신청/취소 알림
@shared_task
def create_participation_status_notice(participation_id, notice_type):
    try:
        participation = Participation.objects.select_related("party", "user").get(id=participation_id)
    except Participation.DoesNotExist:
        return

    party_title = participation.party.title
    user = participation.user
    
    message = ""
    if notice_type == Notice.PARTY_APPLIED:
        message = f"'{party_title}' 파티에 신청이 완료되었습니다."
    elif notice_type == Notice.PARTY_CANCELED:
        message = f"'{party_title}' 파티 신청이 취소되었습니다."

    if message:
        Notice.objects.create(
            user=user,
            target_party=participation.party,
            notice_type=notice_type,
            message=message
        )
