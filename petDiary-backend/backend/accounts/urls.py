from django.urls import path

from . import views

urlpatterns = [
    path("auth/register/", views.UserCreateView.as_view(), name="user-register"),
    path("auth/check-username/", views.CheckUsernameView.as_view(), name="check-username"),
    path("auth/change-password/", views.ChangePasswordView.as_view(), name="change-password"),
    path("auth/forgot-password/", views.ForgotPasswordView.as_view(), name="forgot-password"),
    path("auth/reset-password/", views.ResetPasswordView.as_view(), name="reset-password"),
    path("users/me/", views.UserMeView.as_view(), name="user-me"),
]
