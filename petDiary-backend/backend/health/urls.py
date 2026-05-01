from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .attachment_views import (
    AttachmentProcessAIView,
    AttachmentDetailView,
    AttachmentServeView,
    RecordAttachmentListCreateView,
)
from .reminder_views import (
    ReminderDetailView,
    ReminderDismissView,
    ReminderListCreateView,
)
from .views import HealthRecordViewSet

router = DefaultRouter()
router.register("health-records", HealthRecordViewSet, basename="health-record")

urlpatterns = [
    path("pets/<uuid:pet_pk>/", include(router.urls)),
    # Attachments aninhados em health-records
    path("pets/<uuid:pet_pk>/health-records/<uuid:record_pk>/attachments/",
         RecordAttachmentListCreateView.as_view(), name="record-attachments"),
    # Detail/serve não precisam do pet_pk — id do attachment é UUID único
    path("attachments/<uuid:attachment_id>/",
         AttachmentDetailView.as_view(), name="attachment-detail"),
    path("attachments/<uuid:attachment_id>/process-ai/", AttachmentProcessAIView.as_view(), name="attachment-process-ai"),
    path("attachments/<uuid:attachment_id>/<str:mode>/",
         AttachmentServeView.as_view(), name="attachment-serve"),
    # Reminders
    path("pets/<uuid:pet_pk>/reminders/",
         ReminderListCreateView.as_view(), name="reminder-list-create"),
    path("reminders/<uuid:pk>/",
         ReminderDetailView.as_view(), name="reminder-detail"),
    path("reminders/<uuid:pk>/dismiss/",
         ReminderDismissView.as_view(), name="reminder-dismiss"),
]
