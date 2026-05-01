from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import User
from .serializers import (
    ChangePasswordSerializer,
    UserCreateSerializer,
    UserSerializer,
)


class UserCreateView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserCreateSerializer
    permission_classes = [permissions.AllowAny]


class UserMeView(generics.RetrieveUpdateDestroyAPIView):
    """GET / PUT / DELETE do próprio usuário.

    DELETE aplica soft-delete LGPD-compliant: anonimiza dados pessoais,
    promove caretaker mais antigo a OWNER nos pets afetados, cancela
    Subscription PRO, blacklista refresh tokens, audita.
    """
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

    def delete(self, request, *args, **kwargs):
        from django.db import transaction
        from rest_framework_simplejwt.token_blacklist.models import (
            BlacklistedToken, OutstandingToken,
        )
        from pets.models import PetMember
        from billing.models import Subscription
        from audit.helpers import log_action
        import uuid as uuid_mod

        user = request.user

        # Confirmação obrigatória via header (dupla confirmação no front)
        confirm = request.headers.get("X-Confirm-Delete", "").lower()
        if confirm not in ("yes", "true", "excluir"):
            return Response(
                {"detail": "Header X-Confirm-Delete obrigatório (digite 'EXCLUIR' no front)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            # 1. Promover CARETAKERs em pets que user é OWNER
            owned_memberships = PetMember.objects.filter(
                user=user, role=PetMember.Role.OWNER,
            ).select_related("pet")
            for owner_m in owned_memberships:
                next_owner = (
                    PetMember.objects
                    .filter(pet=owner_m.pet, role=PetMember.Role.CARETAKER)
                    .order_by("added_at")
                    .first()
                )
                if next_owner:
                    next_owner.role = PetMember.Role.OWNER
                    next_owner.save(update_fields=["role"])
                    log_action(
                        actor=user, action="UPDATE",
                        entity=next_owner, pet=next_owner.pet,
                        description=f"Promoveu {next_owner.user.full_name} para OWNER (saída do tutor)",
                    )

            # 2. Cancelar Subscription PRO ativa
            sub = getattr(user, "subscription", None)
            if sub and sub.plan_type == Subscription.Plan.PRO:
                sub.cancel_at_period_end = True
                sub.status = Subscription.Status.CANCELED
                sub.save(update_fields=["cancel_at_period_end", "status", "updated_at"])

            # 3. Blacklist todos os refresh tokens
            for tok in OutstandingToken.objects.filter(user=user):
                BlacklistedToken.objects.get_or_create(token=tok)

            # 4. Auditoria ANTES de anonimizar (preserva nome real)
            log_action(
                actor=user, action="DELETE",
                entity_type="User", entity_id=user.id,
                description=f"Usuário {user.full_name} solicitou exclusão da conta (LGPD)",
                request=request,
            )

            # 5. Anonimização LGPD
            anon_suffix = uuid_mod.uuid4().hex[:8]
            user.username = f"deleted_{anon_suffix}"
            user.email = ""
            user.full_name = "Usuário excluído"
            user.phone = ""
            user.whatsapp = False
            user.document = ""
            user.crmv = ""
            user.clinic_name = ""
            user.address_zip = ""
            user.address_street = ""
            user.address_number = ""
            user.address_complement = ""
            user.address_district = ""
            user.address_city = ""
            user.address_state = ""
            user.is_active = False
            user.set_unusable_password()
            user.save()

        return Response(
            {"detail": "Sua conta foi excluída. Seus dados pessoais foram anonimizados conforme a LGPD."},
            status=status.HTTP_200_OK,
        )


class ChangePasswordView(APIView):
    """Permite ao usuário autenticado trocar a própria senha.

    Regras:
    - Se `must_change_password=True` (caretaker recém-convidado), o
      `current_password` é OPCIONAL — primeira troca dispensa a senha
      temporária informada pelo OWNER.
    - Em qualquer outro caso, o `current_password` é obrigatório e
      precisa bater com a senha atual.
    - Após sucesso, `must_change_password` vira False e os refresh tokens
      anteriores do usuário são blacklistados (defesa contra reuso).
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        current = (serializer.validated_data.get("current_password") or "").strip()
        new_password = serializer.validated_data["new_password"]

        # current_password obrigatório se NÃO está em must_change_password
        if not user.must_change_password:
            if not current:
                return Response(
                    {"current_password": ["Este campo é obrigatório."]},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if not user.check_password(current):
                return Response(
                    {"current_password": ["Senha atual incorreta."]},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        user.set_password(new_password)
        user.must_change_password = False
        user.save(update_fields=["password", "must_change_password"])

        # Invalida sessões anteriores (refresh tokens deste user)
        from rest_framework_simplejwt.token_blacklist.models import (
            BlacklistedToken,
            OutstandingToken,
        )
        for tok in OutstandingToken.objects.filter(user=user):
            BlacklistedToken.objects.get_or_create(token=tok)

        return Response(
            {"detail": "Senha alterada com sucesso. Faça login novamente."},
            status=status.HTTP_200_OK,
        )


class CheckUsernameView(APIView):
    """Endpoint público para verificar disponibilidade de username em tempo real."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        username = (request.query_params.get("username") or "").strip().lower()

        if not username or len(username) < 3:
            return Response(
                {"available": False, "reason": "too_short"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        exists = User.objects.filter(username__iexact=username).exists()
        return Response({"available": not exists, "username": username})


class PetDiaryTokenObtainPairView(TokenObtainPairView):
    """Custom token view com regra de sessão única para veterinários.

    Comportamento:
    - TUTOR: múltiplas sessões coexistem (família compartilha conta em vários
      dispositivos sem problema).
    - VET: ao logar, blacklista TODOS os refresh tokens anteriores não-blacklistados.
      Resultado: assim que o refresh expirar (ou for usado), o vet anterior cai.
      Para garantir derrubada imediata, manter ACCESS_TOKEN_LIFETIME curto
      (30 min é o default).

    A regra protege dados clínicos: em uma clínica com vários computadores,
    se alguém esquece a sessão aberta, o próximo login automaticamente derruba.
    """

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code != 200:
            return response

        username = (request.data.get("username") or "").strip().lower()
        if not username:
            return response

        try:
            user = User.objects.get(username__iexact=username)
        except User.DoesNotExist:
            return response

        if user.role == User.Role.VET:
            # Blacklist todos os outstanding tokens deste vet ANTERIORES ao recém-emitido.
            # O novo refresh acabou de ser criado por super().post() e já consta no
            # OutstandingToken; o `exclude` por jti garante que não blacklistamos ele mesmo.
            new_refresh_jti = (response.data or {}).get("refresh")
            # SimpleJWT armazena jti dentro do token; pra cobrir tudo simplesmente
            # blacklistamos os tokens com `created_at` anterior ao do novo.
            from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken
            from rest_framework_simplejwt.tokens import RefreshToken

            new_jti = None
            if new_refresh_jti:
                try:
                    new_jti = RefreshToken(new_refresh_jti).get("jti")
                except Exception:
                    new_jti = None

            outstanding = OutstandingToken.objects.filter(user=user)
            if new_jti:
                outstanding = outstanding.exclude(jti=new_jti)

            for token in outstanding:
                BlacklistedToken.objects.get_or_create(token=token)

        return response
