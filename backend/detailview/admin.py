import random
from django.contrib import admin
from django.urls import path
from django.http import HttpResponseRedirect
from django.utils.html import format_html

from .models import Place, Tag, Party, Participation
from utils.partyAI import generate_party_by_ai


@admin.register(Place)
class PlaceAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'address', 'capacity')
    search_fields = ('name', 'address')
    fields = ('name', 'address', 'capacity', 'photo', 'map')

    # 상단에 커스텀 버튼 추가
    change_list_template = "admin/detailview/place/change_list.html"

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                'create-random-ai-party/',
                self.admin_site.admin_view(self.create_random_ai_party),
                name='create-random-ai-party',
            ),
        ]
        return custom_urls + urls

    def create_random_ai_party(self, request, *args, **kwargs):
        try:
            places = list(Place.objects.all())
            if not places:
                raise ValueError("장소가 하나도 없습니다. 먼저 Place를 등록하세요.")

            place = random.choice(places)  # 랜덤 선택
            ai_data = generate_party_by_ai(place)
            if not ai_data:
                raise ValueError("AI가 파티 정보를 생성하지 못했습니다.")

            party = Party.objects.create(
                place=place,
                title=ai_data.get("title", f"{place.name} AI 파티"),
                description=ai_data.get("description", "AI가 생성한 파티입니다."),
                start_time=ai_data.get("start_time"),
                max_participants=ai_data.get("max_participants", place.capacity or 4)
            )

            # 태그 추가
            for tag_name in ai_data.get("tags", []):
                tag_obj, _ = Tag.objects.get_or_create(name=tag_name)
                party.tags.add(tag_obj)

            self.message_user(request, f"랜덤 장소 '{place.name}'에 AI 파티가 생성되었습니다.")
        except Exception as e:
            self.message_user(request, f"파티 생성 실패: {e}", level='error')

        return HttpResponseRedirect("../")


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)


class ParticipationInline(admin.TabularInline):
    model = Participation
    extra = 1
    autocomplete_fields = ('user',)


@admin.register(Party)
class PartyAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'title', 'place', 'start_time',
        'max_participants', 'get_applied_count', 'is_approved'
    )
    list_filter = ('is_approved', 'place', 'start_time', 'tags')
    search_fields = ('title', 'place__name', 'tags__name')
    autocomplete_fields = ('place', 'tags')
    inlines = [ParticipationInline]

    def get_applied_count(self, obj):
        return obj.participations.count()
    get_applied_count.short_description = '신청 인원'


@admin.register(Participation)
class ParticipationAdmin(admin.ModelAdmin):
    list_display = ('id', 'party', 'user')
    list_filter = ('party',)
    search_fields = ('party__title', 'user__username', 'user__email')
    autocomplete_fields = ('party', 'user')
