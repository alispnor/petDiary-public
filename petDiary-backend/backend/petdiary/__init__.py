"""Inicializa structlog antes de qualquer import do Django."""
from .logging_config import configure_structlog

# Configuração via variáveis de ambiente (lê DEBUG diretamente, sem dj-database-url ainda)
import os
configure_structlog(debug=os.environ.get("DEBUG", "False").lower() == "true")
