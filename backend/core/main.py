"""
backend/core/main.py - FastAPI Application for VeriAPH (SIH26261).
OWNER: P2

Implements standard endpoints returning mock data from mock_data/*.json.
"""

from datetime import datetime, timezone
import json
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, Query, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

from backend.schemas import (
    Application,
    AuditEntry,
    AuditVerification,
    DashboardStats,
    Decision,
    DecisionAction,
    DocStatus,
    Document,
    Evidence,
    Finding,
    FindingSeverity,
    FindingSource,
    MetricsResponse,
    RuleItem,
    RuleUpdate,
    STANDARD_FIELDS,
)

app = FastAPI(
    title="VeriAPH API",
    description="AI Document Verification Engine for AICTE Applications (SIH26261)",
    version="1.0.0",
)

# Enable CORS for React frontend (Vite default :5173, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Base directory for mock data
BASE_DIR = Path(__file__).resolve().parent.parent.parent
MOCK_DATA_DIR = BASE_DIR / "mock_data"


def load_json_file(filename: str) -> Any:
    """Helper to load JSON file from mock_data directory."""
    path = MOCK_DATA_DIR / filename
    if not path.exists():
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Mock data file {filename} not found at {path}",
        )
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json_file(filename: str, data: Any) -> None:
    """Helper to write JSON file to mock_data directory."""
    path = MOCK_DATA_DIR / filename
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


# ---------------------------------------------------------------------------
# Application Endpoints
# ---------------------------------------------------------------------------
@app.get(
    "/applications",
    response_model=List[Application],
    tags=["Applications"],
    summary="List all applications",
)
def get_applications() -> List[Application]:
    """Retrieve all submitted AICTE applications."""
    data = load_json_file("applications.json")
    return [Application.model_validate(app_item) for app_item in data]


@app.get(
    "/applications/{app_id}",
    response_model=Application,
    tags=["Applications"],
    summary="Get application by ID",
)
def get_application(app_id: str) -> Application:
    """Retrieve a specific application by its ID."""
    applications = get_applications()
    for app_item in applications:
        if app_item.id == app_id:
            return app_item
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Application '{app_id}' not found",
    )


@app.post(
    "/applications",
    response_model=Application,
    status_code=status.HTTP_201_CREATED,
    tags=["Applications"],
    summary="Submit new application",
)
def create_application(app_payload: Application) -> Application:
    """Submit a new application to the scrutiny queue."""
    raw_data = load_json_file("applications.json")
    # Check if ID already exists
    for item in raw_data:
        if item.get("id") == app_payload.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Application with ID '{app_payload.id}' already exists",
            )
    raw_data.append(app_payload.model_dump())
    save_json_file("applications.json", raw_data)
    return app_payload


@app.post(
    "/applications/{app_id}/validate",
    response_model=Application,
    tags=["Applications"],
    summary="Trigger document validation pipeline",
)
def validate_application(app_id: str) -> Application:
    """
    Trigger synchronous validation pipeline across checkers (forensics, issuer, rules, crosscheck).
    Currently returns the application with evaluated findings from mock data.
    """
    return get_application(app_id)


# ---------------------------------------------------------------------------
# Document & Rendering Endpoints
# ---------------------------------------------------------------------------
@app.get(
    "/documents/{doc_id}/findings",
    response_model=List[Finding],
    tags=["Documents"],
    summary="Get findings for a document",
)
def get_document_findings(doc_id: str) -> List[Finding]:
    """Retrieve all findings flagged for a specific document."""
    applications = get_applications()
    for app_item in applications:
        for doc in app_item.documents:
            if doc.id == doc_id:
                return doc.findings
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Document '{doc_id}' not found",
    )


@app.get(
    "/documents/{doc_id}/render",
    tags=["Documents"],
    summary="Render document page image or PDF slice",
)
def render_document(
    doc_id: str,
    rev: Optional[str] = Query(None, description="Optional revision identifier"),
    page: int = Query(1, ge=1, description="1-indexed page number"),
    request: Request = None,
):
    """
    Render document page visually for review canvas.
    Returns SVG document canvas when requested by browser/img, or JSON metadata if requested.
    """
    # Look up document name
    doc_name = doc_id
    applications = get_applications()
    for app_item in applications:
        for doc in app_item.documents:
            if doc.id == doc_id:
                doc_name = doc.filename
                break

    # If client explicitly asks for JSON
    accept_header = request.headers.get("accept", "") if request else ""
    if "application/json" in accept_header:
        return {
            "doc_id": doc_id,
            "filename": doc_name,
            "page": page,
            "rev": rev,
            "status": "ready",
            "dimensions": {"width_pt": 595.28, "height_pt": 841.89},
        }

    # Generate clean SVG document representation
    revision_text = f"Revision: {rev}" if rev else "Base Revision"
    svg_content = f"""<svg xmlns="http://www.w3.org/2000/svg" width="600" height="850" viewBox="0 0 600 850">
  <rect width="100%" height="100%" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
  <rect x="20" y="20" width="560" height="60" fill="#f8fafc" stroke="#e2e8f0" rx="4"/>
  <text x="40" y="55" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#0f172a">VeriAPH Document Viewer</text>
  <text x="400" y="55" font-family="Arial, sans-serif" font-size="12" fill="#64748b">{revision_text}</text>
  <text x="40" y="110" font-family="Arial, sans-serif" font-size="14" font-weight="600" fill="#1e293b">{doc_name}</text>
  <text x="40" y="130" font-family="Arial, sans-serif" font-size="12" fill="#64748b">Document ID: {doc_id} | Page {page}</text>
  <line x1="40" y1="145" x2="560" y2="145" stroke="#cbd5e1" stroke-width="1"/>
  <rect x="40" y="160" width="520" height="40" fill="#f1f5f9" rx="3"/>
  <text x="50" y="185" font-family="Arial, sans-serif" font-size="12" fill="#334155">AICTE Scrutiny Verification Overlay - Page {page}</text>
  <rect x="72" y="240" width="240" height="30" fill="none" stroke="#ef4444" stroke-width="2" stroke-dasharray="4"/>
  <text x="75" y="260" font-family="Arial, sans-serif" font-size="11" fill="#b91c1c">[Inspected Bounding Box Region]</text>
  <rect x="40" y="800" width="520" height="30" fill="#f8fafc"/>
  <text x="240" y="820" font-family="Arial, sans-serif" font-size="11" fill="#94a3b8">Page {page} - VeriAPH Forensic Render</text>
</svg>"""
    return Response(content=svg_content, media_type="image/svg+xml")


# ---------------------------------------------------------------------------
# Decision Endpoints
# ---------------------------------------------------------------------------
@app.post(
    "/findings/{finding_id}/decision",
    response_model=Decision,
    status_code=status.HTTP_200_OK,
    tags=["Decisions"],
    summary="Record officer decision on a finding",
)
def record_decision(finding_id: str, decision: Decision) -> Decision:
    """Record an official scrutiny officer decision (accept, override, clarify) on a finding."""
    if decision.finding_id != finding_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Path finding_id '{finding_id}' does not match body '{decision.finding_id}'",
        )
    decisions_list = load_json_file("decisions.json")
    # Append or replace decision
    updated_list = [d for d in decisions_list if d.get("finding_id") != finding_id]
    updated_list.append(decision.model_dump())
    save_json_file("decisions.json", updated_list)
    return decision


# ---------------------------------------------------------------------------
# Rules Endpoints
# ---------------------------------------------------------------------------
@app.get(
    "/rules",
    response_model=List[RuleItem],
    tags=["Rules"],
    summary="List all validation rules",
)
def get_rules() -> List[RuleItem]:
    """Retrieve list of all active regulatory and forensic rules."""
    rules_data = load_json_file("rules.json")
    return [RuleItem.model_validate(r) for r in rules_data]


@app.patch(
    "/rules/{rule_id}",
    response_model=RuleItem,
    tags=["Rules"],
    summary="Update rule configuration",
)
def update_rule(rule_id: str, update_payload: RuleUpdate) -> RuleItem:
    """Update active status, severity, or clause reference of a rule."""
    rules_data = load_json_file("rules.json")
    matched_idx = -1
    for idx, rule in enumerate(rules_data):
        if rule.get("id") == rule_id:
            matched_idx = idx
            break

    if matched_idx == -1:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Rule '{rule_id}' not found",
        )

    target_rule = rules_data[matched_idx]
    if update_payload.active is not None:
        target_rule["active"] = update_payload.active
    if update_payload.severity is not None:
        target_rule["severity"] = update_payload.severity.value
    if update_payload.clause_ref is not None:
        target_rule["clause_ref"] = update_payload.clause_ref

    rules_data[matched_idx] = target_rule
    save_json_file("rules.json", rules_data)
    return RuleItem.model_validate(target_rule)


# ---------------------------------------------------------------------------
# Audit Endpoints
# ---------------------------------------------------------------------------
@app.get(
    "/audit",
    response_model=List[AuditEntry],
    tags=["Audit"],
    summary="List audit trail entries",
)
def get_audit_trail() -> List[AuditEntry]:
    """Retrieve tamper-evident audit log of all scrutiny activities."""
    audit_data = load_json_file("audit.json")
    return [AuditEntry.model_validate(entry) for entry in audit_data]


@app.get(
    "/audit/verify",
    response_model=AuditVerification,
    tags=["Audit"],
    summary="Verify cryptographic integrity of audit chain",
)
def verify_audit_chain() -> AuditVerification:
    """Verify hash chain integrity across all audit records."""
    verify_data = load_json_file("audit_verify.json")
    return AuditVerification.model_validate(verify_data)


# ---------------------------------------------------------------------------
# Metrics & Dashboard Endpoints
# ---------------------------------------------------------------------------
@app.get(
    "/metrics",
    response_model=MetricsResponse,
    tags=["Metrics"],
    summary="Get verification metrics and accuracy stats",
)
def get_metrics() -> MetricsResponse:
    """Retrieve verification performance and benchmark metrics."""
    metrics_data = load_json_file("metrics.json")
    return MetricsResponse.model_validate(metrics_data)


@app.get(
    "/dashboard",
    response_model=DashboardStats,
    tags=["Dashboard"],
    summary="Get dashboard overview statistics",
)
def get_dashboard() -> DashboardStats:
    """Retrieve high-level dashboard metrics and recent scrutiny activity."""
    dashboard_data = load_json_file("dashboard.json")
    return DashboardStats.model_validate(dashboard_data)
