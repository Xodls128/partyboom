from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/signup/", include("signup.urls")),
    path("api/homemap/", include(("homemap.urls", "homemap"), namespace="homemap")),
    path("api/detailview/", include(("detailview.urls", "detailview"), namespace="detailview")),
    path("api/mypage/", include("mypage.urls")),
    path("api/partyassist/", include(("partyassist.urls", "partyassist"), namespace="partyassist")),
    path("api/notice/", include("notice.urls")),
    path("api/v1/game/", include(("game.urls", "game"), namespace="game")),
    path("api/reserve/", include("reserve.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    