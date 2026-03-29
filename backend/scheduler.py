from __future__ import annotations

import logging
from typing import Optional

from apscheduler.schedulers.background import BackgroundScheduler

from backend.database import SessionLocal
from ml.model import ml_models


logger = logging.getLogger("dakshtra.scheduler")
_scheduler: Optional[BackgroundScheduler] = None


def _retrain_models_job() -> None:
    db = SessionLocal()
    try:
        result = ml_models.train_models(db)
        if isinstance(result, dict) and result.get("error"):
            logger.warning("Scheduled retraining completed with warning: %s", result["error"])
        else:
            logger.info("Scheduled retraining completed")
    except Exception:
        logger.exception("Scheduled retraining failed")
    finally:
        db.close()


def initialize_scheduler() -> None:
    global _scheduler

    if _scheduler is not None and _scheduler.running:
        return

    _scheduler = BackgroundScheduler(timezone="UTC")
    _scheduler.add_job(
        _retrain_models_job,
        trigger="interval",
        hours=24,
        id="daily_retrain",
        replace_existing=True,
        max_instances=1,
    )
    _scheduler.start()
    logger.info("Background scheduler started")


def shutdown_scheduler() -> None:
    global _scheduler

    if _scheduler is None:
        return

    if _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Background scheduler stopped")

    _scheduler = None
