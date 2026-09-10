from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(30), default="citizen", index=True)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Zone(Base):
    __tablename__ = "zones"
    id: Mapped[str] = mapped_column(String(20), primary_key=True)
    name: Mapped[str] = mapped_column(String(160))
    risk: Mapped[str] = mapped_column(String(20), default="safe", index=True)
    risk_score: Mapped[float] = mapped_column(Float, default=0)
    population: Mapped[int] = mapped_column(Integer, default=0)
    sos: Mapped[int] = mapped_column(Integer, default=0)
    rainfall: Mapped[str] = mapped_column(String(50), default="0 mm/hr")
    water_level: Mapped[str] = mapped_column(String(50), default="Normal")
    lat: Mapped[float] = mapped_column(Float)
    lng: Mapped[float] = mapped_column(Float)
    recommendation: Mapped[str] = mapped_column(Text, default="Monitor situation.")


class EnvironmentalData(Base):
    __tablename__ = "environmental_data"
    id: Mapped[int] = mapped_column(primary_key=True)
    zone_id: Mapped[str] = mapped_column(String(20), index=True)
    rainfall_mm_hr: Mapped[float] = mapped_column(Float, default=0)
    soil_moisture: Mapped[float] = mapped_column(Float, default=0)
    water_level: Mapped[float] = mapped_column(Float, default=0)
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)


class Prediction(Base):
    __tablename__ = "predictions"
    id: Mapped[int] = mapped_column(primary_key=True)
    zone_id: Mapped[str] = mapped_column(String(20), index=True)
    risk: Mapped[str] = mapped_column(String(20))
    score: Mapped[float] = mapped_column(Float)
    confidence: Mapped[float] = mapped_column(Float)
    factors: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)


class RiskHistory(Base):
    __tablename__ = "risk_history"
    id: Mapped[int] = mapped_column(primary_key=True)
    zone_id: Mapped[str] = mapped_column(String(20), index=True)
    risk: Mapped[str] = mapped_column(String(20))
    score: Mapped[float] = mapped_column(Float)
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)


class Alert(Base):
    __tablename__ = "alerts"
    id: Mapped[int] = mapped_column(primary_key=True)
    message: Mapped[str] = mapped_column(Text)
    severity: Mapped[str] = mapped_column(String(20), default="info")
    zone_id: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(20), default="active")
    created_by: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)


class SOSRequest(Base):
    __tablename__ = "sos_requests"
    id: Mapped[int] = mapped_column(primary_key=True)
    request_code: Mapped[str] = mapped_column(String(30), unique=True, index=True)
    type: Mapped[str] = mapped_column(String(40))
    zone_id: Mapped[str] = mapped_column(String(20), index=True)
    location: Mapped[str] = mapped_column(String(160))
    people: Mapped[int] = mapped_column(Integer, default=1)
    priority: Mapped[str] = mapped_column(String(20), default="normal", index=True)
    status: Mapped[str] = mapped_column(String(30), default="received", index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    citizen_name: Mapped[str] = mapped_column(String(120), default="Citizen")
    assigned_team: Mapped[str | None] = mapped_column(String(120), nullable=True)
    created_by: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)


class CommunityReport(Base):
    __tablename__ = "community_reports"
    id: Mapped[int] = mapped_column(primary_key=True)
    zone_id: Mapped[str] = mapped_column(String(20), index=True)
    category: Mapped[str] = mapped_column(String(50))
    description: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="received")
    created_by: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Shelter(Base):
    __tablename__ = "shelters"
    id: Mapped[str] = mapped_column(String(20), primary_key=True)
    name: Mapped[str] = mapped_column(String(160))
    location: Mapped[str] = mapped_column(String(160))
    capacity: Mapped[int] = mapped_column(Integer)
    occupied: Mapped[int] = mapped_column(Integer, default=0)
    lat: Mapped[float] = mapped_column(Float)
    lng: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(20), default="safe")


class Resource(Base):
    __tablename__ = "resources"
    id: Mapped[str] = mapped_column(String(20), primary_key=True)
    type: Mapped[str] = mapped_column(String(60), index=True)
    available: Mapped[int] = mapped_column(Integer, default=0)
    demand: Mapped[int] = mapped_column(Integer, default=0)
    unit: Mapped[str] = mapped_column(String(30))
    provider: Mapped[str] = mapped_column(String(120))
    location: Mapped[str] = mapped_column(String(120))


class Responder(Base):
    __tablename__ = "responders"
    id: Mapped[str] = mapped_column(String(30), primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    type: Mapped[str] = mapped_column(String(30))
    location: Mapped[str] = mapped_column(String(120))
    status: Mapped[str] = mapped_column(String(30), default="available")
    members: Mapped[int] = mapped_column(Integer, default=1)


class Assignment(Base):
    __tablename__ = "assignments"
    id: Mapped[int] = mapped_column(primary_key=True)
    request_id: Mapped[int] = mapped_column(Integer, index=True)
    responder_id: Mapped[str] = mapped_column(String(30), index=True)
    status: Mapped[str] = mapped_column(String(30), default="assigned")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
