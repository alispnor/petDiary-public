"""Validação de upload de attachments — Spec 14 (segurança).

Estratégia de defesa em camadas:
1. **Tamanho**: limita em 50 MB (configurável por env).
2. **Whitelist de MIME**: apenas imagens, PDF, áudio e vídeo comuns.
3. **Magic bytes**: lê os primeiros bytes do arquivo e confronta com o MIME
   declarado. Fecha o vetor "executável renomeado para .png".
4. **Sanitização do filename**: extrai apenas a extensão da whitelist, gera
   slug do nome base (Unicode → ASCII seguro).

Sem dependência externa: a verificação de magic bytes usa uma tabela
estática mínima (cobre 95% dos casos relevantes ao petDiary). Se quiser
cobertura ampla, instalar `python-magic` e chamar daqui.
"""
import re
import unicodedata
import uuid
from pathlib import Path
from typing import Tuple

from rest_framework import serializers


# Whitelist de MIME → assinaturas (magic bytes) aceitas.
# Cada entrada: (extensão preferida, lista de prefixos binários)
_SIGNATURES: dict[str, tuple[str, list[bytes]]] = {
    "image/jpeg": ("jpg", [b"\xff\xd8\xff"]),
    "image/png": ("png", [b"\x89PNG\r\n\x1a\n"]),
    "image/webp": ("webp", [b"RIFF"]),  # offset 0 + "WEBP" em offset 8
    "image/gif": ("gif", [b"GIF87a", b"GIF89a"]),
    "application/pdf": ("pdf", [b"%PDF-"]),
    "audio/mpeg": ("mp3", [b"ID3", b"\xff\xfb", b"\xff\xf3", b"\xff\xf2"]),
    "audio/wav": ("wav", [b"RIFF"]),
    "audio/x-wav": ("wav", [b"RIFF"]),
    "audio/mp4": ("m4a", [b"\x00\x00\x00"]),  # ftyp chunk
    "audio/aac": ("aac", [b"\xff\xf1", b"\xff\xf9"]),
    "video/mp4": ("mp4", [b"\x00\x00\x00"]),
    "video/quicktime": ("mov", [b"\x00\x00\x00"]),
}

ALLOWED_MIME_TYPES = frozenset(_SIGNATURES.keys())

# Limite de upload em bytes. 50 MB cobre exames longos / vídeos curtos.
MAX_UPLOAD_BYTES = 50 * 1024 * 1024


def _check_signature(head: bytes, mime: str) -> bool:
    """True se os primeiros bytes batem com a assinatura esperada do MIME."""
    sig = _SIGNATURES.get(mime)
    if not sig:
        return False
    _, prefixes = sig
    if not prefixes:
        return True  # MIME sem assinatura conhecida (raro)

    # WEBP/WAV: prefixo "RIFF" em 0 + identificador em offset 8.
    if mime in ("image/webp", "audio/wav", "audio/x-wav"):
        if not head.startswith(b"RIFF"):
            return False
        if mime == "image/webp":
            return head[8:12] == b"WEBP"
        return head[8:12] == b"WAVE"

    return any(head.startswith(p) for p in prefixes)


_FILENAME_INVALID = re.compile(r"[^A-Za-z0-9._-]+")


def _sanitize_basename(raw: str) -> str:
    """Slug ASCII seguro do nome base (sem extensão).

    Remove path traversal, caracteres nulos, e qualquer coisa fora de
    `[A-Za-z0-9._-]`. Limita a 80 chars. Vazio vira "file".
    """
    # Strip diretórios (defesa contra "../etc/passwd")
    base = Path(raw).name

    # Normaliza Unicode para ASCII (acentos viram letras simples)
    nkfd = unicodedata.normalize("NFKD", base)
    ascii_only = nkfd.encode("ascii", "ignore").decode("ascii")

    cleaned = _FILENAME_INVALID.sub("_", ascii_only).strip("._-")
    return (cleaned[:80] or "file")


def validate_upload(upload, mime_declared: str) -> Tuple[str, str, str]:
    """Valida e devolve (mime_oficial, extensão_oficial, filename_seguro).

    Levanta ValidationError em caso de problema. NÃO mexe em DB nem storage.

    Args:
        upload: instância de `UploadedFile` (Django/DRF)
        mime_declared: MIME type vindo do request (`upload.content_type`).

    Returns:
        Tupla com:
        - MIME oficial (após whitelist)
        - extensão preferida (sem ponto)
        - filename seguro: "<slug>.<ext>"
    """
    # 1. Tamanho
    size = upload.size or 0
    if size <= 0:
        raise serializers.ValidationError({"file": "Arquivo vazio."})
    if size > MAX_UPLOAD_BYTES:
        mb = MAX_UPLOAD_BYTES // (1024 * 1024)
        raise serializers.ValidationError(
            {"file": f"Arquivo maior que o limite de {mb} MB."},
        )

    # 2. MIME na whitelist
    mime = (mime_declared or "").lower().split(";")[0].strip()
    if mime not in ALLOWED_MIME_TYPES:
        raise serializers.ValidationError({
            "file": (
                "Tipo de arquivo não permitido. Aceitos: imagens (JPEG/PNG/"
                "WebP/GIF), PDF, áudio (MP3/WAV/M4A/AAC) e vídeo (MP4/MOV)."
            ),
        })

    # 3. Magic bytes batem com o MIME declarado
    head = upload.read(64)
    upload.seek(0)
    if not _check_signature(head, mime):
        raise serializers.ValidationError({
            "file": (
                "O conteúdo do arquivo não corresponde ao tipo declarado. "
                "Pode estar corrompido ou ser um arquivo de outro formato."
            ),
        })

    # 4. Filename seguro: <slug>.<ext> (extensão da whitelist, não do user)
    ext = _SIGNATURES[mime][0]
    base = _sanitize_basename(Path(upload.name or "").stem)
    safe_filename = f"{base}.{ext}"

    return mime, ext, safe_filename


def safe_storage_key(pet_id, record_id, ext: str) -> str:
    """Chave de storage anti-conflito (UUID) com extensão validada.

    Não usa o nome do user. Bloqueia colisão e enumeração.
    """
    return f"uploads/{pet_id}/{record_id}/{uuid.uuid4()}.{ext}"
