from django.contrib import admin

from .models import Place, Tag, Party, Participation


@admin.register(Place)
class PlaceAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'address', 'capacity')
    search_fields = ('name', 'address')


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
    