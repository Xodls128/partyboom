from rest_framework import serializers
from django.db import transaction
from django.utils import timezone
from detailview.models import Participation, Party
from .models import Payment
from django.contrib.auth import get_user_model

User = get_user_model()

class ReserveJoinSerializer(serializers.Serializer):
    party_id = serializers.IntegerField()

    def validate_party_id(self, value):
        try:
            party = Party.objects.get(id=value)
        except Party.DoesNotExist:
            raise serializers.ValidationError("존재하지 않는 파티입니다.")
        return party

    def create(self, validated_data):
        user = self.context["request"].user
        party = validated_data["party_id"]
        
        same_day_exists = Participation.objects.filter(
            user=user,
            party__start_time__date=party.start_time.date()
        ).exists()

        # 정원 체크
        confirmed_count = party.participations.filter(
            status=Participation.Status.CONFIRMED
        ).count()
        if confirmed_count >= party.max_participants:
            raise serializers.ValidationError("정원이 가득 찼습니다.")

        # 이미 존재하는 신청 체크
        existing = Participation.objects.filter(user=user, party=party).first()
        if existing:
            raise serializers.ValidationError(
                f"이미 신청한 파티입니다. 현재 상태: {existing.get_status_display()}"
            )

        # 참여 생성 (결제 대기 상태)
        participation = Participation.objects.create(
            user=user,
            party=party,
            status=Participation.Status.PENDING_PAYMENT,
        )
        return participation


class UserSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "points"]   # 프론트에서 필요한 필드만 노출

class PartySimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Party
        fields = ["id", "deposit"]  # 프론트에서 필요한 필드만 노출

class ParticipationDetailSerializer(serializers.ModelSerializer):
    user = UserSimpleSerializer(read_only=True)
    party = PartySimpleSerializer(read_only=True)

    class Meta:
        model = Participation
        fields = ["id", "user", "party", "status", "created_at", "paid_at"]

class ParticipationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Participation
        fields = ["id", "party", "user", "status", "created_at", "paid_at"]

class ReservePaySerializer(serializers.Serializer):
    participation_id = serializers.IntegerField()
    payment_method = serializers.ChoiceField(
        choices=Payment.Method.choices, default=Payment.Method.POINT
    )

    @transaction.atomic
    def create(self, validated_data):
        user = self.context["request"].user
        participation_id = validated_data["participation_id"]
        method = validated_data["payment_method"]

        try:
            participation = Participation.objects.select_related("party").get(id=participation_id)
        except Participation.DoesNotExist:
            raise serializers.ValidationError("존재하지 않는 예약 정보입니다.")

        # 본인 예약인지 확인
        if participation.user != user:
            raise serializers.ValidationError("본인의 예약만 결제할 수 있습니다.")

        # 상태 확인
        if participation.status != Participation.Status.PENDING_PAYMENT:
            raise serializers.ValidationError(
                f"결제 대기 상태가 아닙니다. 현재 상태: {participation.get_status_display()}"
            )

        party = participation.party

        # 결제 수단 확인
        if method != Payment.Method.POINT:
            raise serializers.ValidationError("현재는 포인트 결제만 지원합니다.")

        # 포인트 확인
        if user.points < party.deposit:
            raise serializers.ValidationError(
                f"포인트가 부족합니다. 필요한 포인트: {party.deposit}, 보유 포인트: {user.points}"
            )

        # 포인트 차감
        user.points -= party.deposit
        user.save(update_fields=["points"])

        # 참여 확정
        participation.status = Participation.Status.CONFIRMED
        participation.paid_at = timezone.now()
        participation.save(update_fields=["status", "paid_at"])

        # 결제 기록 생성
        payment = Payment.objects.create(
            user=user,
            participation=participation,
            amount=party.deposit,
            status=Payment.Status.SUCCESS,
            method=method,
        )
        return payment

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ["id", "participation", "user", "amount", "status", "created_at"]
        read_only_fields = fields