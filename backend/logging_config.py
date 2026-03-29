import logging
import os
from typing import Optional


_CONFIGURED = False


def configure_logging(level: Optional[str] = None) -> None:
    """Configure root logging once for the backend process."""
    global _CONFIGURED

    if _CONFIGURED:
        return

    resolved_level = (level or os.getenv("LOG_LEVEL", "INFO")).upper()
    numeric_level = getattr(logging, resolved_level, logging.INFO)

    logging.basicConfig(
        level=numeric_level,
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    )
    _CONFIGURED = True


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
