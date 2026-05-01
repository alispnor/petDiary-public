from django.urls import path

from . import views

urlpatterns = [
    path("notifications/", views.NotificationListView.as_view(), name="notif-list"),
    path("notifications/unread-count/", views.UnreadCountView.as_view(), name="notif-unread-count"),
    path("notifications/<uuid:pk>/read/", views.MarkReadView.as_view(), name="notif-read"),
    path("notifications/read-all/", views.MarkAllReadView.as_view(), name="notif-read-all"),
    path("notifications/preferences/", views.PreferencesView.as_view(), name="notif-prefs"),
    path("notifications/devices/register/", views.DeviceRegisterView.as_view(), name="notif-device-register"),
    path("notifications/devices/unregister/", views.DeviceUnregisterView.as_view(), name="notif-device-unregister"),
    path("notifications/web-push/vapid-public-key/", views.VapidPublicKeyView.as_view(), name="notif-vapid"),
]
