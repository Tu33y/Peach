import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.infrastructure.database import Base, get_db
from app.main import app
from app.domain.models import DBCategory

# Setup SQLite in-memory database for fast, isolated unit testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_api.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def init_test_db():
    Base.metadata.create_all(bind=engine)
    # Seed default categories
    db = TestingSessionLocal()
    if not db.query(DBCategory).first():
        cat1 = DBCategory(name="Riparazioni", description="Riparazioni elettroniche")
        cat2 = DBCategory(name="Lezioni", description="Lezioni private")
        db.add_all([cat1, cat2])
        db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("./test_api.db"):
        os.remove("./test_api.db")

@pytest.fixture
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
