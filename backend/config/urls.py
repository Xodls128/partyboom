"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from signup.views import kakao_callback_debug

urlpatterns = [
    path('admin/', admin.site.urls),

    # 카카오 로그인 콜백
    path("oauth/kakao/callback", kakao_callback_debug),

    # API 라우트
    path("api/signup/", include("signup.urls")),
    path("api/homemap/", include(("homemap.urls", "homemap"), namespace="homemap")),
    path("api/detailview/", include(("detailview.urls", "detailview"), namespace="detailview")),
    path("api/mypage/", include("mypage.urls")),
]
