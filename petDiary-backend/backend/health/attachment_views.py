"""Views para upload, listagem, download e remoção de attachments.

Permissão: usa pets.permissions.IsPetMemberOrHasVetAccess (membros OU vet ativo).
"""
import mimetypes
from pathlib import Path

from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404
from django.utils.translation import gettext_lazy as _
from rest_framework import permissions, serializers, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from pets.models import Pet
from pets.permissions import vet_has_active_access
from accounts.models import User

from .models import HealthRecord, HealthRecordAttachment
from .services.storage import get_storage, make_storage_key


# ─────────────────── Serializers ───────────────────

class AttachmentSerializer(serializers.ModelSerializer):
    download_url = serializers.SerializerMethodField()
    view_url = serializers.SerializerMethodField()

    class Meta:
        model = HealthRecordAttachment
        fields = (
            "id", "record", "file_name", "description", "mime_type",
            "file_size", "uploaded_by", "created_at",
            "download_url", "view_url",
        )
        read_only_fields = ("id", "record", "uploaded_by", "created_at",
                            "file_size", "mime_type", "download_url", "view_url")

    def get_download_url(self, obj):
        return f"/api/v1/attachments/{obj.id}/download/"

    def get_view_url(self, obj):
        return f"/api/v1/attachments/{obj.id}/view/"


class AttachmentUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    file_name = serializers.CharField(required=False, allow_blank=True, max_length=255)
    description = serializers.CharField(required=False, allow_blank=True, max_length=500)


# ─────────────────── Permission helper ───────────────────

def _user_can_access_pet(user, pet) -> bool:
    if user.role == User.Role.TUTOR:
        return pet.has_member(user)
    if user.role == User.Role.VET:
        return vet_has_active_access(user, pet)
    return False


# ─────────────────── Views ───────────────────

class RecordAttachmentListCreateView(APIView):
    """GET lista anexos do record · POST faz upload."""

    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def _get_record(self, request, pet_pk, record_pk) -> HealthRecord:
        record = get_object_or_404(HealthRecord, pk=record_pk, pet_id=pet_pk)
        if not _user_can_access_pet(request.user, record.pet):
            self.permission_denied(request, message=_("Sem permissão para este pet."))
        return record

    def get(self, request, pet_pk, record_pk):
        record = self._get_record(request, pet_pk, record_pk)
        attachments = record.attachments.select_related("uploaded_by").all()
        return Response(AttachmentSerializer(attachments, many=True).data)

    def post(self, request, pet_pk, record_pk):
        record = self._get_record(request, pet_pk, record_pk)

        ser = AttachmentUploadSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        upload = ser.validated_data["file"]
        custom_name = (ser.validated_data.get("file_name") or "").strip()
        description = (ser.validated_data.get("description") or "").strip()

        original = upload.name
        # Sanitização básica do nome
        display_name = custom_name or original
        display_name = display_name[:255]

        mime_type = upload.content_type or mimetypes.guess_type(original)[0] or "application/octet-stream"
        size = upload.size or 0

        # Geração de chave única (anti-conflito) com extensão preservada
        key = make_storage_key(record.pet_id, record.id, original)
        storage = get_storage()
        storage.save(key, upload, mime_type)

        attachment = HealthRecordAttachment.objects.create(
            record=record,
            storage_key=key,
            file_name=display_name,
            description=description,
            mime_type=mime_type,
            file_size=size,
            uploaded_by=request.user,
        )

        return Response(
            AttachmentSerializer(attachment).data,
            status=status.HTTP_201_CREATED,
        )


class AttachmentDetailView(APIView):
    """DELETE remove o attachment + arquivo do storage."""

    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, attachment_id):
        att = get_object_or_404(HealthRecordAttachment, pk=attachment_id)
        if not _user_can_access_pet(request.user, att.record.pet):
            return Response(
                {"detail": "Sem permissão."}, status=status.HTTP_403_FORBIDDEN,
            )

        storage = get_storage()
        storage.delete(att.storage_key)
        att.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AttachmentServeView(APIView):
    """Serve o arquivo binário (download forçado ou view inline).

    Distinção pela URL: /attachments/<id>/download/ vs /attachments/<id>/view/
    """

    permission_classes = [permissions.IsAuthenticated]

    def _get_attachment(self, request, attachment_id) -> HealthRecordAttachment:
        att = get_object_or_404(HealthRecordAttachment, pk=attachment_id)
        if not _user_can_access_pet(request.user, att.record.pet):
            raise Http404
        return att

    def get(self, request, attachment_id, mode: str):
        att = self._get_attachment(request, attachment_id)
        storage = get_storage()
        try:
            file_obj = storage.open(att.storage_key)
        except FileNotFoundError:
            raise Http404("Arquivo não encontrado no storage.")

        as_attachment = (mode == "download")
        response = FileResponse(
            file_obj,
            content_type=att.mime_type or "application/octet-stream",
            as_attachment=as_attachment,
            filename=att.file_name,
        )
        return response


# ─────────── Processamento IA (Spec 04 — gated PRO) ───────────

class AttachmentProcessAIView(APIView):
    """POST /attachments/<id>/process-ai/ — dispara OCR/Whisper/sumarização.

    Aplica IsActivePro: caretaker herda o PRO do owner do pet (decisão
    durável Ali). Em modo mock, retorna texto fictício realista; em
    produção (AI_PROVIDER=openai), chama OpenAI.
    """
    from billing.permissions import IsActivePro

    permission_classes = [permissions.IsAuthenticated, IsActivePro]

    def post(self, request, attachment_id):
        from health.services.ai import get_ai_service
        from health.services.storage import get_storage

        att = get_object_or_404(HealthRecordAttachment, pk=attachment_id)
        if not _user_can_access_pet(request.user, att.record.pet):
            return Response({"detail": "Sem permissão."}, status=status.HTTP_403_FORBIDDEN)

        # Resolve path local (mock só lê do storage local; OpenAI usaria URL)
        ai = get_ai_service()
        if att.mime_type.startswith("image/"):
            text = ai.extract_text_from_image(att.storage_key, att.mime_type)
        elif att.mime_type.startswith("audio/"):
            text = ai.transcribe_audio(att.storage_key)
        else:
            return Response(
                {"detail": "Apenas imagens e áudios são processados."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        summary = ai.summarize(text)

        # Salva no record (raw_extracted_text)
        att.record.raw_extracted_text = text
        att.record.save(update_fields=["raw_extracted_text", "updated_at"])

        return Response({
            "extracted_text": text,
            "suggested_title": summary["title"],
            "suggested_summary": summary["summary"],
            "ai_provider": getattr(__import__("django.conf", fromlist=["settings"]).settings, "AI_PROVIDER", "mock"),
        })
