from django.urls import path

from . import views

urlpatterns = [
    path("auth/register/", views.UserCreateView.as_view(), name="user-register"),
    path("auth/check-username/", views.CheckUsernameView.as_view(), name="check-username"),
    path("auth/change-password/", views.ChangePasswordView.as_view(), name="change-password"),
    path("users/me/", views.UserMeView.as_view(), name="user-me"),
]
