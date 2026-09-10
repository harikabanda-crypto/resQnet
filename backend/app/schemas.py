from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: str
    password: str = Field(min_length=6)
    role: str = "citizen"
    phone: str | None = None


class UserOut(ORMModel):
    id: int
    name: str
    email: str
    role: str
    phone: str | None
    is_active: bool


class ZoneOut(ORMModel):
    id: str
    name: str
    risk: str
    risk_score: float
    population: int
    sos: int
    rainfall: str
    water_level: str
    lat: float
    lng: float
    recommendation: str


class PredictionInput(BaseModel):
    zone_id: str
    rainfall_mm_hr: float = Field(ge=0)
    soil_moisture: float = Field(ge=0, le=100)
    water_level: float = Field(ge=0)


class PredictionOut(ORMModel):
    id: int
    zone_id: str
    risk: str
    score: float
    confidence: float
    factors: list[str]
    created_at: datetime


class AlertCreate(BaseModel):
    message: str = Field(min_length=1)
    severity: str = "info"
    zone_id: str | None = None


class AlertUpdate(BaseModel):
    status: str


class AlertOut(ORMModel):
    id: int
    message: str
    severity: str
    zone_id: str | None
    status: str
    created_by: int | None
    created_at: datetime


class SOSCreate(BaseModel):
    type: str
    zone_id: str
    location: str
    people: int = Field(default=1, ge=1)
    priority: str = "normal"
    description: str | None = None
    citizen_name: str = "Citizen"


class SOSUpdate(BaseModel):
    status: str | None = None
    priority: str | None = None
    assigned_team: str | None = None


class SOSOut(ORMModel):
    id: int
    request_code: str
    type: str
    zone_id: str
    location: str
    people: int
    priority: str
    status: str
    description: str | None
    citizen_name: str
    assigned_team: str | None
    created_by: int | None
    created_at: datetime


class ReportCreate(BaseModel):
    zone_id: str
    category: str
    description: str = Field(min_length=1)


class ReportOut(ORMModel):
    id: int
    zone_id: str
    category: str
    description: str
    status: str
    created_by: int | None
    created_at: datetime


class ShelterOut(ORMModel):
    id: str
    name: str
    location: str
    capacity: int
    occupied: int
    lat: float
    lng: float
    status: str


class ResourceOut(ORMModel):
    id: str
    type: str
    available: int
    demand: int
    unit: str
    provider: str
    location: str


class ResponderOut(ORMModel):
    id: str
    name: str
    type: str
    location: str
    status: str
    members: int


class AssignmentCreate(BaseModel):
    responder_id: str


class AssignmentOut(ORMModel):
    id: int
    request_id: int
    responder_id: str
    status: str
    created_at: datetime
