import json
from datetime import datetime, timedelta
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..ml_engine import get_ml_engine
from ..models import Alert, Assignment, CommunityReport, Prediction, Resource, Responder, RiskHistory, RoadBlockage, SOSRequest, Shelter, User, Zone
from ..routing_engine import calculate_safe_routes
from ..schemas import (AlertCreate, AlertOut, AlertUpdate, AssignmentCreate, AssignmentOut, PredictionInput, PredictionOut,
                       ReportCreate, ReportOut, ResourceOut, ResponderOut, RoadBlockageCreate, RoadBlockageOut, RoadBlockageUpdate,
                       RouteOut, SOSCreate, SOSOut, SOSUpdate, ShelterOut, ZoneOut)
from ..security import get_current_user, require_roles

router = APIRouter(prefix="/api", tags=["resqnet"])


@router.get("/risk/zones", response_model=list[ZoneOut])
def list_zones(
    risk: str | None = None,
    limit: int | None = Query(None, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = select(Zone).order_by(Zone.id)
    if risk:
        query = query.where(Zone.risk == risk)
    if limit is not None:
        query = query.offset(offset).limit(limit)
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


@router.get("/risk/zones/{zone_id}/inspection")
def zone_ml_inspection(zone_id: str, db: Session = Depends(get_db)):
    if not db.get(Zone, zone_id):
        raise HTTPException(404, "Zone not found")
    engine = get_ml_engine()
    res = engine.predict(zone_id)
    return {
        "zone_id": zone_id,
        "risk": res.risk,
        "score": res.score,
        "confidence": res.confidence,
        "ml_probability": res.ml_probability,
        "factors": res.factors,
        "shap_factors": res.shap_factors,
        "features": res.feature_values,
    }


@router.get("/risk/summary")
def get_ner_risk_summary(db: Session = Depends(get_db)):
    """Summary of regional risk counts and top critical zones across the NER."""
    total = db.scalar(select(func.count(Zone.id))) or 0
    counts = {
        "critical": db.scalar(select(func.count(Zone.id)).where(Zone.risk == "critical")) or 0,
        "high": db.scalar(select(func.count(Zone.id)).where(Zone.risk == "high")) or 0,
        "moderate": db.scalar(select(func.count(Zone.id)).where(Zone.risk == "moderate")) or 0,
        "safe": db.scalar(select(func.count(Zone.id)).where(Zone.risk == "safe")) or 0,
    }
    top_zones = db.scalars(
        select(Zone).order_by(desc(Zone.risk_score)).limit(10)
    ).all()
    return {
        "total_zones": total,
        "risk_counts": counts,
        "top_risk_zones": [
            {
                "id": z.id,
                "name": z.name,
                "risk": z.risk,
                "risk_score": z.risk_score,
                "rainfall": z.rainfall,
                "water_level": z.water_level,
                "lat": z.lat,
                "lng": z.lng,
            }
            for z in top_zones
        ],
    }


@router.post("/risk/sync-live-weather")
def sync_weather(db: Session = Depends(get_db), _: User = Depends(require_roles("authority"))):
    """Synchronize near-real-time weather observations and recalculate zone risks."""
    from ..weather_sync import sync_live_weather_data
    return sync_live_weather_data(db)


@router.post("/predict", response_model=PredictionOut)
def predict(payload: PredictionInput, db: Session = Depends(get_db), _: User = Depends(require_roles("authority"))):
    if not db.get(Zone, payload.zone_id):
        raise HTTPException(404, "Zone not found")

    overrides = payload.model_dump(exclude={"zone_id"}, exclude_none=True)
    engine = get_ml_engine()
    res = engine.predict(payload.zone_id, overrides=overrides)

    prediction = Prediction(
        zone_id=payload.zone_id,
        risk=res.risk,
        score=res.score,
        confidence=res.confidence,
        factors=json.dumps(res.factors),
    )
    db.add(prediction)
    db.add(RiskHistory(zone_id=payload.zone_id, risk=res.risk, score=res.score))

    zone = db.get(Zone, payload.zone_id)
    zone.risk, zone.risk_score = res.risk, res.score
    if payload.rainfall_mm_hr is not None:
        zone.rainfall = f"{payload.rainfall_mm_hr:g} mm/hr"
    if payload.water_level is not None:
        zone.water_level = f"{payload.water_level:g}"
    db.commit()
    db.refresh(prediction)

    return PredictionOut(
        id=prediction.id,
        zone_id=prediction.zone_id,
        risk=prediction.risk,
        score=prediction.score,
        confidence=prediction.confidence,
        factors=res.factors,
        ml_probability=res.ml_probability,
        shap_factors=res.shap_factors,
        created_at=prediction.created_at,
    )


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


@router.get("/routes", response_model=list[RouteOut])
def list_routes(
    zone_id: str | None = None,
    shelter_id: str | None = None,
    db: Session = Depends(get_db),
):
    """Calculate dynamic evacuation routes, penalizing hazardous zones and active road blockages."""
    if zone_id and not db.get(Zone, zone_id):
        raise HTTPException(404, "Zone not found")
    return calculate_safe_routes(db, zone_id=zone_id, shelter_id=shelter_id)


@router.get("/blockages", response_model=list[RoadBlockageOut])
def list_blockages(
    status_filter: str | None = Query(None, alias="status"),
    passable: bool | None = None,
    db: Session = Depends(get_db),
):
    """List active road blockages affecting disaster transit routes."""
    query = select(RoadBlockage).order_by(desc(RoadBlockage.created_at))
    if status_filter:
        query = query.where(RoadBlockage.status == status_filter)
    if passable is not None:
        query = query.where(RoadBlockage.passable == passable)
    return db.scalars(query).all()


@router.post("/blockages", response_model=RoadBlockageOut, status_code=201)
def create_blockage(
    payload: RoadBlockageCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("authority", "volunteer", "ngo")),
):
    """Report a new road hazard or blockage."""
    blockage_id = f"RB{uuid4().hex[:6].upper()}"
    blockage = RoadBlockage(id=blockage_id, **payload.model_dump())
    db.add(blockage)
    db.commit()
    db.refresh(blockage)
    return blockage


@router.put("/blockages/{blockage_id}", response_model=RoadBlockageOut)
def update_blockage(
    blockage_id: str,
    payload: RoadBlockageUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("authority", "volunteer", "ngo")),
):
    """Update clearance status or passability of an active road blockage."""
    blockage = db.get(RoadBlockage, blockage_id)
    if not blockage:
        raise HTTPException(404, "Road blockage not found")
    for key, value in payload.model_dump(exclude_none=True).items():
        setattr(blockage, key, value)
    db.commit()
    db.refresh(blockage)
    return blockage


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
