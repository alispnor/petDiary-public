from django.urls import path

from . import views

urlpatterns = [
    path("auth/register/", views.UserCreateView.as_view(), name="user-register"),
    path("auth/check-username/", views.CheckUsernameView.as_view(), name="check-username"),
    path("users/me/", views.UserMeView.as_view(), name="user-me"),
]
