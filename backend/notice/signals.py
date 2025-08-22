from django.db.models.signals import post_save
from django.dispatch import receiver
from detailview.models import Party, Participation
from .models import Notice
from .tasks import create_new_party_notice, create_participation_status_notice


@receiver(post_save, sender=Party)
def send_new_party_notice(sender, instance, created, **kwargs):
    if created:
        # 개발/로컬 확인용
        create_new_party_notice(instance.id)
        # 운영에서는 create_new_party_notice.delay(instance.id)


@receiver(post_save, sender=Participation)
def send_participation_status_notice(sender, instance, created, **kwargs):
    if created:
        create_participation_status_notice(instance.id, Notice.PARTY_APPLIED)
        # create_participation_status_notice.delay(instance.id, Notice.PARTY_APPLIED)
    
    # 취소 상태로 업데이트될 때
    elif not created and instance.status == Participation.Status.CANCELED:
        create_participation_status_notice(instance.id, Notice.PARTY_CANCELED)
        # create_participation_status_notice.delay(instance.id, Notice.PARTY_CANCELED)
