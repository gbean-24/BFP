"""Test configuration and fixtures."""

import pytest
import asyncio
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings

# Override settings for testing
settings.database_url = "sqlite:///./test_tourism_tracker.db"
settings.secret_key = "test-secret-key"

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
def client():
    """Create a test client for the FastAPI application."""
    from main import app
    with TestClient(app) as test_client:
        yield test_client

@pytest.fixture
def test_db():
    """Create a test database session."""
    # This will be implemented when we create the database models
    pass