import json
from datetime import datetime, timedelta
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Alert, Assignment, CommunityReport, Prediction, Resource, Responder, RiskHistory, SOSRequest, Shelter, User, Zone
from ..schemas import (AlertCreate, AlertOut, AlertUpdate, AssignmentCreate, AssignmentOut, PredictionInput, PredictionOut,
                       ReportCreate, ReportOut, ResourceOut, ResponderOut, SOSCreate, SOSOut, SOSUpdate, ShelterOut, ZoneOut)
from ..security import get_current_user, require_roles

router = APIRouter(prefix="/api", tags=["resqnet"])


@router.get("/risk/zones", response_model=list[ZoneOut])
def list_zones(risk: str | None = None, db: Session = Depends(get_db)):
    query = select(Zone).order_by(Zone.id)
    if risk:
        query = query.where(Zone.risk == risk)
    return db.scalars(query).all()


@router.get("/risk/zones/{zone_id}", response_model=ZoneOut)
def get_zone(zone_id: str, db: Session = Depends(get_db)):
    zone = db.get(Zone, zone_id)
    if not zone:
        raise HTTPException(404, "Zone not found")
    return zone


@router.get("/risk/trend/{zone_id}")
def risk_trend(zone_id: str, limit: int = Query(24, ge=1, le=200), db: Session = Depends(get_db)):
    if not db.get(Zone, zone_id):
        raise HTTPException(404, "Zone not found")
    rows = db.scalars(select(RiskHistory).where(RiskHistory.zone_id == zone_id).order_by(desc(RiskHistory.recorded_at)).limit(limit)).all()
    return [{"time": row.recorded_at, "risk": row.risk, "score": row.score} for row in reversed(rows)]


def score_risk(data: PredictionInput) -> tuple[str, float, float, list[str]]:
    score = min(100.0, data.rainfall_mm_hr * 0.55 + data.soil_moisture * 0.25 + data.water_level * 0.20)
    risk = "critical" if score >= 80 else "high" if score >= 60 else "moderate" if score >= 35 else "safe"
    factors = []
    if data.rainfall_mm_hr >= 50:
        factors.append("Heavy rainfall")
    if data.soil_moisture >= 70:
        factors.append("High soil moisture")
    if data.water_level >= 60:
        factors.append("Rising water level")
    return risk, round(score, 2), round(min(99.0, 70 + score * 0.25), 2), factors or ["No elevated factor detected"]


@router.post("/predict", response_model=PredictionOut)
def predict(payload: PredictionInput, db: Session = Depends(get_db), _: User = Depends(require_roles("authority"))):
    if not db.get(Zone, payload.zone_id):
        raise HTTPException(404, "Zone not found")
    risk, score, confidence, factors = score_risk(payload)
    prediction = Prediction(zone_id=payload.zone_id, risk=risk, score=score, confidence=confidence, factors=json.dumps(factors))
    db.add(prediction)
    db.add(RiskHistory(zone_id=payload.zone_id, risk=risk, score=score))
    zone = db.get(Zone, payload.zone_id)
    zone.risk, zone.risk_score = risk, score
    zone.rainfall, zone.water_level = f"{payload.rainfall_mm_hr:g} mm/hr", f"{payload.water_level:g}"
    db.commit()
    db.refresh(prediction)
    result = PredictionOut(
        id=prediction.id,
        zone_id=prediction.zone_id,
        risk=prediction.risk,
        score=prediction.score,
        confidence=prediction.confidence,
        factors=factors,
        created_at=prediction.created_at,
    )
    return result


@router.get("/alerts", response_model=list[AlertOut])
def list_alerts(status_filter: str | None = Query(None, alias="status"), db: Session = Depends(get_db)):
    query = select(Alert).order_by(desc(Alert.created_at))
    if status_filter:
        query = query.where(Alert.status == status_filter)
    return db.scalars(query).all()


@router.post("/alerts", response_model=AlertOut, status_code=201)
def create_alert(payload: AlertCreate, db: Session = Depends(get_db), user: User = Depends(require_roles("authority"))):
    alert = Alert(**payload.model_dump(), created_by=user.id)
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


@router.put("/alerts/{alert_id}", response_model=AlertOut)
def update_alert(alert_id: int, payload: AlertUpdate, db: Session = Depends(get_db), _: User = Depends(require_roles("authority"))):
    alert = db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(404, "Alert not found")
    alert.status = payload.status
    db.commit()
    db.refresh(alert)
    return alert


@router.get("/sos", response_model=list[SOSOut])
def list_sos(status_filter: str | None = Query(None, alias="status"), zone_id: str | None = None, db: Session = Depends(get_db)):
    query = select(SOSRequest).order_by(desc(SOSRequest.created_at))
    if status_filter:
        query = query.where(SOSRequest.status == status_filter)
    if zone_id:
        query = query.where(SOSRequest.zone_id == zone_id)
    return db.scalars(query).all()


@router.post("/sos", response_model=SOSOut, status_code=201)
def create_sos(payload: SOSCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if not db.get(Zone, payload.zone_id):
        raise HTTPException(404, "Zone not found")
    request = SOSRequest(request_code=f"RQ{uuid4().hex[:6].upper()}", created_by=user.id, **payload.model_dump())
    db.add(request)
    zone = db.get(Zone, payload.zone_id)
    zone.sos += 1
    db.commit()
    db.refresh(request)
    return request


@router.get("/sos/{request_id}", response_model=SOSOut)
def get_sos(request_id: int, db: Session = Depends(get_db)):
    request = db.get(SOSRequest, request_id)
    if not request:
        raise HTTPException(404, "SOS request not found")
    return request


@router.put("/sos/{request_id}", response_model=SOSOut)
def update_sos(request_id: int, payload: SOSUpdate, db: Session = Depends(get_db), _: User = Depends(require_roles("authority", "ngo", "volunteer", "delivery"))):
    request = db.get(SOSRequest, request_id)
    if not request:
        raise HTTPException(404, "SOS request not found")
    for key, value in payload.model_dump(exclude_none=True).items():
        setattr(request, key, value)
    db.commit()
    db.refresh(request)
    return request


@router.get("/reports", response_model=list[ReportOut])
def list_reports(db: Session = Depends(get_db)):
    return db.scalars(select(CommunityReport).order_by(desc(CommunityReport.created_at))).all()


@router.post("/reports", response_model=ReportOut, status_code=201)
def create_report(payload: ReportCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if not db.get(Zone, payload.zone_id):
        raise HTTPException(404, "Zone not found")
    report = CommunityReport(**payload.model_dump(), created_by=user.id)
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.get("/shelters", response_model=list[ShelterOut])
def list_shelters(status_filter: str | None = Query(None, alias="status"), db: Session = Depends(get_db)):
    query = select(Shelter).order_by(Shelter.id)
    if status_filter:
        query = query.where(Shelter.status == status_filter)
    return db.scalars(query).all()


@router.get("/resources", response_model=list[ResourceOut])
def list_resources(db: Session = Depends(get_db)):
    return db.scalars(select(Resource).order_by(Resource.type)).all()


@router.get("/responders", response_model=list[ResponderOut])
def list_responders(db: Session = Depends(get_db)):
    return db.scalars(select(Responder).order_by(Responder.id)).all()


@router.post("/sos/{request_id}/assign", response_model=AssignmentOut, status_code=201)
def assign_request(request_id: int, payload: AssignmentCreate, db: Session = Depends(get_db), _: User = Depends(require_roles("authority"))):
    request = db.get(SOSRequest, request_id)
    responder = db.get(Responder, payload.responder_id)
    if not request or not responder:
        raise HTTPException(404, "Request or responder not found")
    assignment = Assignment(request_id=request_id, responder_id=responder.id)
    request.status, request.assigned_team, responder.status = "matched", responder.name, "busy"
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


@router.get("/routes")
def list_routes(zone_id: str | None = None, db: Session = Depends(get_db)):
    if zone_id and not db.get(Zone, zone_id):
        raise HTTPException(404, "Zone not found")
    return [
        {"id": "route_a", "name": "NH65 Direct", "distance_km": 2.1, "time_min": 6, "risk": "high", "safety_score": 32, "recommended": False},
        {"id": "route_b", "name": "Ring Road", "distance_km": 2.8, "time_min": 9, "risk": "low", "safety_score": 94, "recommended": True},
        {"id": "route_c", "name": "Inner Roads", "distance_km": 3.4, "time_min": 12, "risk": "low", "safety_score": 88, "recommended": False},
    ]


@router.get("/dashboard/summary")
def dashboard_summary(db: Session = Depends(get_db)):
    return {
        "affected_population": db.scalar(select(func.sum(Zone.population))) or 0,
        "active_sos": db.scalar(select(func.count(SOSRequest.id)).where(SOSRequest.status.not_in(["delivered", "resolved"]))) or 0,
        "critical_zones": db.scalar(select(func.count(Zone.id)).where(Zone.risk == "critical")) or 0,
        "pending_requests": db.scalar(select(func.count(SOSRequest.id)).where(SOSRequest.status == "received")) or 0,
        "active_responders": db.scalar(select(func.count(Responder.id)).where(Responder.status != "offline")) or 0,
        "ongoing_deliveries": db.scalar(select(func.count(SOSRequest.id)).where(SOSRequest.status == "out_for_delivery")) or 0,
    }
