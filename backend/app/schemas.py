from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


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
    rainfall_mm_hr: float | None = Field(default=None, ge=0)
    soil_moisture: float | None = Field(default=None, ge=0, le=100)
    water_level: float | None = Field(default=None, ge=0)
    # Direct feature overrides (optional)
    elevation: float | None = None
    slope: float | None = None
    aspect: float | None = None
    curvature: float | None = None
    land_cover_code: float | None = None
    historical_landslide_density: float | None = None
    rainfall_1h: float | None = None
    rainfall_3h: float | None = None
    rainfall_6h: float | None = None
    rainfall_12h: float | None = None
    rainfall_24h: float | None = None
    rainfall_3day: float | None = None
    rainfall_7day: float | None = None
    soil_moisture_0_7cm: float | None = None
    soil_moisture_7_28cm: float | None = None
    earthquake_count_7d: float | None = None
    nearest_eq_distance_km: float | None = None
    max_eq_magnitude: float | None = None


class PredictionOut(ORMModel):
    id: int
    zone_id: str
    risk: str
    score: float
    confidence: float
    factors: list[str]
    ml_probability: float | None = None
    shap_factors: dict[str, float] | None = None
    created_at: datetime

    @field_validator("factors", mode="before")
    @classmethod
    def parse_factors(cls, v):
        import json
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
                return [str(parsed)]
            except Exception:
                return [v] if v else []
        return v


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


class RoadBlockageCreate(BaseModel):
    road_name: str
    location: str
    zone_id: str | None = None
    blockage_type: str = "landslide_debris"
    severity: str = "moderate"
    passable: bool = False
    lat: float
    lng: float


class RoadBlockageUpdate(BaseModel):
    status: str | None = None
    passable: bool | None = None
    severity: str | None = None


class RoadBlockageOut(ORMModel):
    id: str
    road_name: str
    location: str
    zone_id: str | None
    blockage_type: str
    severity: str
    passable: bool
    status: str
    lat: float
    lng: float
    created_at: datetime


class RouteOut(BaseModel):
    id: str
    name: str
    distance: str
    distance_km: float
    time: str
    time_min: int
    risk: str
    safety_score: int
    safetyScore: int
    recommended: bool
    reason: str
    destination_shelter: str | None = None
    shelter_id: str | None = None


class SafeRouteRequest(BaseModel):
    origin_lat: float
    origin_lng: float
    dest_lat: float
    dest_lng: float
    zone_id: str | None = None
    shelter_id: str | None = None


class SafeRouteResponse(BaseModel):
    id: str
    name: str
    distance: str
    time: str
    risk: str
    safety_score: int
    safetyScore: int
    recommended: bool
    reason: str
    destination_shelter: str | None = None
    path: list[list[float]] = []
