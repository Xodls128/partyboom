from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from detailview.models import Party

class PartyWaitState(models.Model):
    """파티 대기실의 상태를 추적 (롱폴링용)"""
    party = models.OneToOneField(
        Party,
        on_delete=models.CASCADE,
        related_name="wait_state",
        verbose_name="파티",
    )
    version = models.PositiveIntegerField("상태 버전", default=1)
    last_updated = models.DateTimeField("최종 업데이트", auto_now=True)

    def __str__(self):
        return f"{self.party_id} - Version {self.version}"

@receiver(post_save, sender=Party)
def create_party_wait_state(sender, instance, created, **kwargs):
    if created:
        PartyWaitState.objects.create(party=instance)