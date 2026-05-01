import uuid

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from pets.permissions import IsPetMemberOrHasVetAccess

from .models import HealthRecord
from .serializers import HealthRecordSerializer, UploadURLSerializer


class HealthRecordViewSet(viewsets.ModelViewSet):
    serializer_class = HealthRecordSerializer
    permission_classes = [IsPetMemberOrHasVetAccess]

    def get_queryset(self):
        return HealthRecord.objects.filter(
            pet__id=self.kwargs["pet_pk"]
        ).select_related("pet", "author")

    def perform_create(self, serializer):
        from pets.models import Pet
        pet = Pet.objects.get(pk=self.kwargs["pet_pk"])
        serializer.save(author=self.request.user, pet=pet)

    def get_object(self):
        obj = super().get_object()
        self.check_object_permissions(self.request, obj)
        return obj

    @action(detail=False, methods=["post"], url_path="upload-url")
    def generate_upload_url(self, request, pet_pk=None):
        """Mock de geração de URL pré-assinada para S3."""
        serializer = UploadURLSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        file_name = serializer.validated_data["file_name"]
        mock_key = f"uploads/{pet_pk}/{uuid.uuid4()}/{file_name}"

        return Response(
            {
                "upload_url": f"https://s3.mock.amazonaws.com/petdiary-bucket/{mock_key}",
                "key": mock_key,
            },
            status=status.HTTP_200_OK,
        )
