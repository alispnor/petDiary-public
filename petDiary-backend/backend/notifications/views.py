from decouple import config
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import DevicePushToken, Notification, NotificationPreference
from .serializers import (
    DeviceRegisterSerializer,
    DeviceUnregisterSerializer,
    NotificationPreferenceSerializer,
    NotificationSerializer,
)


class _Pagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = _Pagination

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)


class UnreadCountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(
            user=request.user, read_at__isnull=True
        ).count()
        return Response({"count": count})


class MarkReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        notif = get_object_or_404(Notification, pk=pk, user=request.user)
        if notif.read_at is None:
            notif.read_at = timezone.now()
            notif.save(update_fields=["read_at"])
        return Response(NotificationSerializer(notif).data)


class MarkAllReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        updated = Notification.objects.filter(
            user=request.user, read_at__isnull=True
        ).update(read_at=timezone.now())
        return Response({"updated": updated})


class PreferencesView(generics.RetrieveUpdateAPIView):
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        prefs, _ = NotificationPreference.objects.get_or_create(
            user=self.request.user
        )
        return prefs


class DeviceRegisterView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = DeviceRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data

        platform = d["platform"]
        if platform == DevicePushToken.Platform.WEB:
            obj, created = DevicePushToken.objects.update_or_create(
                web_push_endpoint=d["web_push_endpoint"],
                defaults={
                    "user": request.user,
                    "platform": platform,
                    "web_push_p256dh": d.get("web_push_p256dh", ""),
                    "web_push_auth": d.get("web_push_auth", ""),
                },
            )
        else:
            obj, created = DevicePushToken.objects.update_or_create(
                expo_push_token=d["expo_push_token"],
                defaults={"user": request.user, "platform": platform},
            )

        return Response(
            {"id": str(obj.id), "platform": obj.platform, "created": created},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class DeviceUnregisterView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = DeviceUnregisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data

        qs = DevicePushToken.objects.filter(user=request.user)
        expo = (d.get("expo_push_token") or "").strip()
        web = (d.get("web_push_endpoint") or "").strip()

        if expo:
            qs = qs.filter(expo_push_token=expo)
        elif web:
            qs = qs.filter(web_push_endpoint=web)
        else:
            return Response(
                {"detail": "Informe expo_push_token ou web_push_endpoint."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        deleted, _ = qs.delete()
        return Response({"deleted": deleted})


class VapidPublicKeyView(APIView):
    """Expõe a chave pública VAPID para o frontend fazer subscribe.

    Não requer autenticação — chave é pública por design.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request):
        key = config("VAPID_PUBLIC_KEY", default="")
        return Response({"vapid_public_key": key})
