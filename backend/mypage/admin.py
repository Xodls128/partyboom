from django.contrib import admin
from .models import Review, Report, ExtraSetting

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("id", "party", "user", "q1_rating", "q2_rating", "q3_rating", "comment", "created_at")
    list_filter = ("q1_rating", "q2_rating", "q3_rating", "created_at")
    search_fields = ("user__username", "party__title", "comment")

@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ("id", "party", "reporter", "reported_user", "category", "status", "created_at")
    list_filter = ("category", "status", "created_at")
    search_fields = ("reporter__username", "reported_user__username", "content")

@admin.register(ExtraSetting)
class ExtraSettingAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "grade", "college", "personality", "mbti_i_e", "mbti_n_s", "mbti_f_t", "mbti_p_j")
    search_fields = ("user__username", "grade", "college", "personality")
