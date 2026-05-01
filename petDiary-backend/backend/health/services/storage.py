"""Abstração de storage para attachments — local agora, S3 depois.

A interface StorageBackend é estável; trocar de Local para S3 é uma
mudança de configuração + variáveis de ambiente, sem mexer em views/models.
"""
from __future__ import annotations

import os
import uuid
from abc import ABC, abstractmethod
from pathlib import Path
from typing import BinaryIO

from django.conf import settings


class StorageBackend(ABC):
    """Contrato mínimo para storage de attachments."""

    @abstractmethod
    def save(self, key: str, file_obj: BinaryIO, mime_type: str) -> str:
        """Salva arquivo. Retorna a chave/identificador absoluto."""

    @abstractmethod
    def open(self, key: str) -> BinaryIO:
        """Abre arquivo para leitura."""

    @abstractmethod
    def delete(self, key: str) -> None:
        """Remove arquivo (idempotente — não erra se já não existe)."""

    @abstractmethod
    def get_url(self, key: str, *, inline: bool = False) -> str:
        """Retorna URL pública (ou pre-signed) para servir o arquivo.

        inline=False → forçar download (Content-Disposition: attachment)
        inline=True  → exibir no browser (PDF, imagem)
        """


class LocalStorageBackend(StorageBackend):
    """Salva em MEDIA_ROOT/uploads/. Endpoint Django serve o conteúdo."""

    def _abs(self, key: str) -> Path:
        return Path(settings.MEDIA_ROOT) / key

    def save(self, key: str, file_obj: BinaryIO, mime_type: str) -> str:
        path = self._abs(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "wb") as f:
            for chunk in file_obj.chunks() if hasattr(file_obj, "chunks") else iter(lambda: file_obj.read(8192), b""):
                f.write(chunk)
        return key

    def open(self, key: str) -> BinaryIO:
        return open(self._abs(key), "rb")

    def delete(self, key: str) -> None:
        path = self._abs(key)
        try:
            path.unlink()
        except FileNotFoundError:
            pass

    def get_url(self, key: str, *, inline: bool = False) -> str:
        # No backend local, a URL é um endpoint Django (próxima sub-fase 7.2)
        return ("view" if inline else "download") 


# Stub para S3 — implementar quando Spec 04 (AWS) entrar em produção
class S3StorageBackend(StorageBackend):
    """Backend S3 com presigned URLs (futuro — Spec 04)."""

    def save(self, key: str, file_obj: BinaryIO, mime_type: str) -> str:
        raise NotImplementedError("S3 backend será implementado na Spec 04 (AWS S3 + IA)")

    def open(self, key: str) -> BinaryIO:
        raise NotImplementedError

    def delete(self, key: str) -> None:
        raise NotImplementedError

    def get_url(self, key: str, *, inline: bool = False) -> str:
        raise NotImplementedError


def get_storage() -> StorageBackend:
    """Retorna o backend configurado. Default: local."""
    backend = getattr(settings, "ATTACHMENT_STORAGE_BACKEND", "local")
    if backend == "s3":
        return S3StorageBackend()
    return LocalStorageBackend()


def make_storage_key(pet_id, record_id, filename: str) -> str:
    """Gera key única: <pet_id>/<record_id>/<uuid>.<ext> (evita conflito de nomes)."""
    ext = os.path.splitext(filename)[1].lower()
    return f"attachments/{pet_id}/{record_id}/{uuid.uuid4()}{ext}"
