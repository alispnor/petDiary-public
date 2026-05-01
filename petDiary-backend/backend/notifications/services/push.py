"""Serviço de envio de push notifications.

Mock-first toggleable: por env `PUSH_SERVICE_MODE` escolhe-se entre
`mock` (default — só loga) e `multi` (envia via Expo + WebPush reais).

Classes nunca lançam para o caller. Erros viram contadores no resultado.
"""
import json
import logging
from abc import ABC, abstractmethod
from typing import Any, Iterable

from decouple import config
from django.conf import settings

logger = logging.getLogger(__name__)


class PushService(ABC):
    @abstractmethod
    def send_expo(
        self,
        tokens: Iterable[str],
        title: str,
        body: str,
        data: dict | None = None,
    ) -> dict[str, Any]: ...

    @abstractmethod
    def send_web(
        self,
        subscriptions: Iterable[dict],
        title: str,
        body: str,
        data: dict | None = None,
    ) -> dict[str, Any]: ...


class MockPushService(PushService):
    """Default em DEV/CI. Só loga — não chama rede."""

    def send_expo(self, tokens, title, body, data=None):
        tokens_list = list(tokens)
        logger.info(
            "MOCK push expo: %s tokens, title=%r, body=%r, data=%s",
            len(tokens_list), title, body, data,
        )
        return {"sent": len(tokens_list), "failed": 0, "mock": True}

    def send_web(self, subscriptions, title, body, data=None):
        subs_list = list(subscriptions)
        logger.info(
            "MOCK push web: %s subs, title=%r, body=%r, data=%s",
            len(subs_list), title, body, data,
        )
        return {"sent": len(subs_list), "failed": 0, "mock": True}


class MultiPushService(PushService):
    """Produção: envia via Expo (iOS/Android) e WebPush (browsers)."""

    EXPO_URL = "https://exp.host/--/api/v2/push/send"

    def send_expo(self, tokens, title, body, data=None):
        try:
            import httpx  # type: ignore
        except ImportError:
            logger.error("httpx não instalado — não envia push expo")
            return {"sent": 0, "failed": 0, "error": "httpx_missing"}

        payload = [
            {
                "to": t,
                "title": title,
                "body": body,
                "data": data or {},
                "sound": "default",
                "priority": "high",
            }
            for t in tokens
        ]
        if not payload:
            return {"sent": 0, "failed": 0}

        try:
            r = httpx.post(self.EXPO_URL, json=payload, timeout=10.0)
            r.raise_for_status()
            return {"sent": len(payload), "failed": 0, "response": r.json()}
        except Exception as e:
            logger.exception("expo push falhou: %s", e)
            return {"sent": 0, "failed": len(payload), "error": str(e)}

    def send_web(self, subscriptions, title, body, data=None):
        try:
            from pywebpush import WebPushException, webpush  # type: ignore
        except ImportError:
            logger.error("pywebpush não instalado — não envia push web")
            return {"sent": 0, "failed": 0, "error": "pywebpush_missing"}

        priv = config("VAPID_PRIVATE_KEY", default="")
        contact = config("VAPID_CONTACT_EMAIL", default="ops@petdiary.com.br")
        if not priv:
            logger.warning("VAPID_PRIVATE_KEY ausente — pulando push web")
            return {"sent": 0, "failed": 0, "error": "vapid_missing"}

        sent = 0
        failed = 0
        gone_endpoints: list[str] = []

        for sub in subscriptions:
            try:
                webpush(
                    subscription_info=sub,
                    data=json.dumps(
                        {"title": title, "body": body, "data": data or {}}
                    ),
                    vapid_private_key=priv,
                    vapid_claims={"sub": f"mailto:{contact}"},
                )
                sent += 1
            except WebPushException as e:
                failed += 1
                if e.response is not None and e.response.status_code in (404, 410):
                    gone_endpoints.append(sub.get("endpoint", ""))
                logger.warning("webpush falhou: %s", e)
            except Exception as e:
                failed += 1
                logger.exception("webpush erro: %s", e)

        return {
            "sent": sent,
            "failed": failed,
            "gone_endpoints": gone_endpoints,
        }


_service: PushService | None = None


def get_push_service() -> PushService:
    """Factory cacheada — escolhe a implementação por env."""
    global _service
    if _service is not None:
        return _service

    mode = getattr(settings, "PUSH_SERVICE_MODE", "mock")
    if mode == "multi":
        _service = MultiPushService()
    else:
        _service = MockPushService()
    return _service
