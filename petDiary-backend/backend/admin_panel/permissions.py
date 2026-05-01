from rest_framework import permissions
from accounts.models import User


class IsAdminRole(permissions.BasePermission):
    message = "Apenas administradores podem acessar este recurso."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", "") == User.Role.ADMIN
        )
