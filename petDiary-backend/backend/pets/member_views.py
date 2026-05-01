"""Views para gestão de membros do pet (caretakers/familiares).

Apenas o **OWNER** do pet pode convidar e remover caretakers.
Caretakers e VETs **não** podem usar esses endpoints.
"""
from django.shortcuts import get_object_or_404
from django.utils.translation import gettext_lazy as _
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Pet, PetMember
from .serializers import InviteMemberSerializer, PetMemberSerializer


class _PetOwnerMixin:
    """Carrega o pet pela URL e exige que o user seja OWNER."""

    def get_pet(self, request, pet_pk) -> Pet:
        pet = get_object_or_404(Pet, pk=pet_pk)
        if not pet.is_owner(request.user):
            self.permission_denied(
                request,
                message=_("Apenas o tutor principal pode gerenciar familiares."),
            )
        return pet


class PetMemberListCreateView(_PetOwnerMixin, generics.ListCreateAPIView):
    """GET lista membros, POST convida novo caretaker."""

    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        return InviteMemberSerializer if self.request.method == "POST" else PetMemberSerializer

    def get_queryset(self):
        # Para GET — qualquer membro pode listar (caretaker pode ver outros membros)
        pet_pk = self.kwargs["pet_pk"]
        pet = get_object_or_404(Pet, pk=pet_pk)
        if not pet.has_member(self.request.user):
            return PetMember.objects.none()
        return pet.members.select_related("user").order_by("-added_at")

    def post(self, request, pet_pk):
        pet = self.get_pet(request, pet_pk)

        serializer = InviteMemberSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        member = serializer.save(pet=pet, owner=request.user)

        out = PetMemberSerializer(member)
        return Response(out.data, status=status.HTTP_201_CREATED)


class PetMemberDestroyView(_PetOwnerMixin, APIView):
    """DELETE um caretaker (apenas OWNER pode; não pode remover OWNER)."""

    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pet_pk, member_id):
        pet = self.get_pet(request, pet_pk)

        member = get_object_or_404(PetMember, pk=member_id, pet=pet)

        if member.role == PetMember.Role.OWNER:
            return Response(
                {"detail": _("Não é possível remover o tutor principal do pet.")},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if member.user_id == request.user.id:
            return Response(
                {"detail": _("Você não pode remover a si mesmo.")},
                status=status.HTTP_400_BAD_REQUEST,
            )

        member.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
