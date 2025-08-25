from django.contrib import admin
from .models import Payment

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = (
        "id", "user", "participation", "amount",
        "status", "method", "created_at"
    )
    list_filter = ("status", "method", "created_at")
    search_fields = ("user__username", "user__email")
    ordering = ("-created_at",)