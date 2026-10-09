
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

database_url = URL.create(
    drivername="mysql+pymysql",
    username=os.getenv("DB_USER", "root"),
    password=os.getenv("DB_PASSWORD", ""),
    host=os.getenv("DB_HOST", "localhost"),
    port=int(os.getenv("DB_PORT", "3306")),
    database=os.getenv("DB_NAME", "opportunity_radar"),
)

connect_args = {}
if os.getenv("DB_SSL", "false").lower() in {"1", "true", "yes"}:
    connect_args = {
        "ssl_ca": os.getenv("DB_SSL_CA", "/etc/ssl/certs/ca-certificates.crt"),
        "ssl_verify_cert": True,
        "ssl_verify_identity": True,
    }

engine = create_engine(database_url, pool_pre_ping=True, connect_args=connect_args)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
