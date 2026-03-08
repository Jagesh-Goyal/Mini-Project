import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.all_api import get_db, router, hash_password
from backend.database import Base
from backend.model import User


@pytest.fixture()
def client(tmp_path):
    db_file = tmp_path / "test_dakshtra.db"
    test_db_url = f"sqlite:///{db_file}"

    engine = create_engine(
        test_db_url,
        connect_args={"check_same_thread": False},
    )
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    Base.metadata.create_all(bind=engine)

    # Create default admin user for testing
    TestingSessionLocal_setup = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    db_setup = TestingSessionLocal_setup()
    admin_user = User(
        name="Admin User",
        email="admin@dakshtra.com",
        password_hash=hash_password("admin123"),
    )
    db_setup.add(admin_user)
    db_setup.commit()
    db_setup.close()

    app = FastAPI()
    app.include_router(router)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    Base.metadata.drop_all(bind=engine)
    engine.dispose()
