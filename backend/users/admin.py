from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, SocialAccount

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ("Profile", {"fields": ("name",)}),
    )
    list_display = ("username", "email", "first_name", "last_name", "is_staff", "name")

    
@admin.register(SocialAccount)
class SocialAccountAdmin(admin.ModelAdmin):
    list_display = ("id", "provider", "social_id", "user")
    search_fields = ("provider", "social_id", "user__username", "user__email")
