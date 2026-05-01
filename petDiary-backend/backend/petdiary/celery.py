"""Configuração da Celery para o petDiary.

- Broker e backend: Redis (REDIS_URL)
- Tasks descobertas automaticamente em qualquer app que tenha `tasks.py`
- Beat usa django-celery-beat (schedule armazenado no DB, editável pelo admin)
- CELERY_TASK_ALWAYS_EAGER=True executa tudo síncrono — útil em testes
"""
import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "petdiary.settings")

app = Celery("petdiary")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()


@app.task(bind=True)
def debug_task(self):
    print(f"[celery] request={self.request!r}")
