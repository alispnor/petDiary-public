"""Abstração de IA: OCR de imagens, transcrição de áudio, sumarização.

Toggle: AI_PROVIDER=mock (default) | openai

Quando o Ali tiver OPENAI_API_KEY:
1. AI_PROVIDER=openai no .env
2. Implementar OpenAIService.{extract_text_from_image, transcribe_audio, summarize}
   com biblioteca openai
"""
from __future__ import annotations

import logging
from abc import ABC, abstractmethod

from django.conf import settings


log = logging.getLogger(__name__)


class AIService(ABC):
    @abstractmethod
    def extract_text_from_image(self, file_path: str, mime_type: str = "") -> str:
        """OCR: lê imagem e retorna texto."""

    @abstractmethod
    def transcribe_audio(self, file_path: str) -> str:
        """Whisper: transcreve áudio e retorna texto."""

    @abstractmethod
    def summarize(self, text: str) -> dict:
        """Gera {title, summary} a partir de texto bruto extraído."""


class MockAIService(AIService):
    """Simula respostas realistas baseadas no nome do arquivo.

    Cobre os 3 casos típicos do petDiary:
    - imagem de receita → texto fictício de receita
    - áudio de sintomas → transcrição fictícia
    - texto bruto → resumo + título
    """

    SAMPLE_PRESCRIPTION = (
        "RECEITA VETERINÁRIA\n"
        "Paciente: <pet>\n"
        "Medicamento: Amoxicilina 250mg\n"
        "Posologia: 1 comprimido a cada 12h, por 7 dias\n"
        "Observações: administrar com alimento."
    )
    SAMPLE_AUDIO = (
        "Hoje notei que o pet está mais quieto que o normal. "
        "Comeu pouco no almoço. Vou levar pra consulta amanhã."
    )

    def extract_text_from_image(self, file_path: str, mime_type: str = "") -> str:
        log.info("ai_mock_ocr", extra={"path": file_path})
        return self.SAMPLE_PRESCRIPTION

    def transcribe_audio(self, file_path: str) -> str:
        log.info("ai_mock_whisper", extra={"path": file_path})
        return self.SAMPLE_AUDIO

    def summarize(self, text: str) -> dict:
        log.info("ai_mock_summarize", extra={"text_length": len(text)})
        # Pega primeira linha como título e usa primeiros 200 chars como resumo
        lines = [l.strip() for l in text.strip().splitlines() if l.strip()]
        title = lines[0][:80] if lines else "Registro automático"
        return {
            "title": title,
            "summary": text[:300] + ("…" if len(text) > 300 else ""),
        }


class OpenAIService(AIService):
    """Stub. Implementar com biblioteca openai quando tiver key."""

    def extract_text_from_image(self, file_path: str, mime_type: str = "") -> str:
        raise NotImplementedError("OpenAIService: instale openai + use settings.OPENAI_API_KEY")

    def transcribe_audio(self, file_path: str) -> str:
        raise NotImplementedError("OpenAIService: instale openai + use settings.OPENAI_API_KEY")

    def summarize(self, text: str) -> dict:
        raise NotImplementedError("OpenAIService: instale openai + use settings.OPENAI_API_KEY")


def get_ai_service() -> AIService:
    provider = getattr(settings, "AI_PROVIDER", "mock").lower()
    if provider == "openai":
        return OpenAIService()
    return MockAIService()
