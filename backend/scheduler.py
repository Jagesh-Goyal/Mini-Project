"""
Model Retraining Scheduler
Automatically retrain ML models on a schedule using APScheduler
"""

import os
from datetime import datetime, timezone
try:
    from apscheduler.schedulers.background import BackgroundScheduler  # pyright: ignore[reportMissingImports]
    from apscheduler.triggers.cron import CronTrigger  # pyright: ignore[reportMissingImports]
except Exception:  # pragma: no cover
    BackgroundScheduler = None  # type: ignore[assignment]
    CronTrigger = None  # type: ignore[assignment]
from sqlalchemy.orm import Session

from backend.database import SessionLocal
from backend.logging_config import get_logger
from ml.model import ml_models

logger = get_logger("dakshtra.scheduler")

scheduler = BackgroundScheduler() if BackgroundScheduler is not None else None


def retrain_models_job():
    """
    Background job to retrain ML models periodically.
    Called daily at 2 AM UTC (configurable via RETRAIN_SCHEDULE_HOUR env var).
    """
    db = SessionLocal()
    try:
        logger.info("Starting scheduled model retraining job...")
        
        # Check if enough data exists
        from backend.model import Employee, EmployeeSkill
        emp_count = db.query(Employee).count()
        skill_count = db.query(EmployeeSkill).count()
        
        if emp_count < 5 or skill_count < 5:
            logger.info(
                f"Insufficient data for retraining: "
                f"{emp_count} employees, {skill_count} skill assignments. Skipping."
            )
            return
        
        # Generate training data and retrain
        training_data = ml_models.generate_synthetic_training_data(db, months=24)
        if training_data is None or len(training_data) < 20:
            logger.warning("Insufficient training data generated. Skipping retraining.")
            return
        
        # Train models
        ml_models.train_demand_forecast_model(training_data)
        ml_models.train_turnover_prediction_model(training_data)
        ml_models.save_models()
        
        logger.info(
            "✅ Model retraining completed successfully at "
            f"{datetime.now(timezone.utc).isoformat()}"
        )
        
    except Exception as e:
        logger.error(f"❌ Model retraining failed: {str(e)}", exc_info=True)
    
    finally:
        db.close()


def initialize_scheduler():
    """
    Initialize the background scheduler with configured jobs.
    Should be called once at application startup.
    """
    # Get configuration from environment
    retrain_enabled = os.getenv("ENABLE_MODEL_RETRAINING", "true").lower() == "true"
    retrain_hour = int(os.getenv("RETRAIN_SCHEDULE_HOUR", "2"))  # 2 AM UTC by default
    retrain_minute = int(os.getenv("RETRAIN_SCHEDULE_MINUTE", "0"))  # Top of hour

    if scheduler is None or CronTrigger is None:
        logger.warning("APScheduler not available. Install dependencies with: pip install -r requirements.txt")
        return
    
    if not retrain_enabled:
        logger.info("Model retraining scheduler is disabled (ENABLE_MODEL_RETRAINING=false)")
        return
    
    try:
        # Remove existing job if present (idempotent)
        if scheduler.get_job("retrain_models"):
            scheduler.remove_job("retrain_models")
        
        # Add daily retraining job
        scheduler.add_job(
            retrain_models_job,
            trigger=CronTrigger(hour=retrain_hour, minute=retrain_minute, timezone="UTC"),
            id="retrain_models",
            name="Daily Model Retraining",
            replace_existing=True,
        )
        
        logger.info(
            f"✅ Model retraining scheduler initialized: Daily at {retrain_hour:02d}:{retrain_minute:02d} UTC"
        )
        
        # Start scheduler if not already running
        if not scheduler.running:
            scheduler.start()
            logger.info("Background scheduler started")
        
    except Exception as e:
        logger.error(f"Failed to initialize scheduler: {str(e)}", exc_info=True)


def shutdown_scheduler():
    """Gracefully shutdown the scheduler."""
    if scheduler is not None and scheduler.running:
        scheduler.shutdown(wait=True)
        logger.info("Background scheduler stopped")


def get_next_retrain_time():
    """Get the next scheduled model retraining time."""
    if scheduler is None:
        return None
    job = scheduler.get_job("retrain_models")
    if job:
        return job.next_run_time
    return None


def trigger_immediate_retrain():
    """
    Manually trigger model retraining immediately (non-blocking).
    Used for on-demand retraining via API endpoint.
    """
    try:
        if scheduler is not None and scheduler.running:
            scheduler.add_job(retrain_models_job, id="retrain_immediate")
            logger.info("Immediate model retraining triggered")
            return {"status": "queued", "message": "Retraining job queued"}
        else:
            logger.warning("Scheduler not running. Running retraining inline.")
            retrain_models_job()
            return {"status": "completed", "message": "Retraining completed"}
    except Exception as e:
        logger.error(f"Failed to trigger immediate retraining: {str(e)}")
        return {"status": "error", "message": str(e)}
