"""
tests/test_endpoints.py - Contract & Mock Data API tests for VeriAPH (SIH26261).
Verifies that all required endpoints start, return expected shapes, and match schemas.
"""

import pytest
from fastapi.testclient import TestClient

from backend.core.main import app
from backend.schemas import (
    Application,
    AuditEntry,
    AuditVerification,
    DashboardStats,
    Decision,
    DocStatus,
    Finding,
    MetricsResponse,
    RuleItem,
    STANDARD_FIELDS,
)

client = TestClient(app)


def test_standard_fields():
    """Verify the 8 standard document fields are defined correctly."""
    assert len(STANDARD_FIELDS) == 8
    expected = [
        "trust_name",
        "survey_no",
        "land_area_sqm",
        "lease_start",
        "lease_end",
        "cert_valid_from",
        "cert_valid_to",
        "signatories",
    ]
    assert STANDARD_FIELDS == expected


def test_get_applications():
    """Verify GET /applications returns Application A and Application B."""
    response = client.get("/applications")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 2

    # Validate against Pydantic schema
    apps = [Application.model_validate(item) for item in data]
    app_a = next((a for a in apps if a.id == "APP-2026-8812"), None)
    app_b = next((a for a in apps if a.id == "APP-2026-9045"), None)

    assert app_a is not None, "Application A must exist"
    assert app_b is not None, "Application B must exist"

    # Application A checks: 6 documents, covering all 6 statuses, 5+ findings
    assert len(app_a.documents) == 6
    doc_statuses = {doc.status for doc in app_a.documents}
    assert doc_statuses == {
        DocStatus.verified,
        DocStatus.mismatch_detected,
        DocStatus.expired,
        DocStatus.verification_pending,
        DocStatus.source_unavailable,
        DocStatus.manual_review_required,
    }
    all_findings_a = [f for doc in app_a.documents for f in doc.findings]
    assert len(all_findings_a) >= 5, f"Expected 5+ findings on App A, got {len(all_findings_a)}"

    # Check that findings have real-looking bboxes (PDF points, length 4)
    for f in all_findings_a:
        assert len(f.bbox) == 4
        x0, y0, x1, y1 = f.bbox
        assert x0 < x1
        assert y0 < y1

    # Application B checks: clean, all verified, 0 findings
    assert len(app_b.documents) >= 1
    for doc in app_b.documents:
        assert doc.status == DocStatus.verified
        assert len(doc.findings) == 0


def test_get_application_by_id():
    """Verify GET /applications/{id} returns specific application."""
    response = client.get("/applications/APP-2026-8812")
    assert response.status_code == 200
    app_data = response.json()
    assert app_data["id"] == "APP-2026-8812"

    # 404 for non-existent
    res_404 = client.get("/applications/NON_EXISTENT_ID")
    assert res_404.status_code == 404


def test_validate_application():
    """Verify POST /applications/{id}/validate returns validated application."""
    response = client.post("/applications/APP-2026-8812/validate")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "APP-2026-8812"


def test_get_document_findings():
    """Verify GET /documents/{id}/findings returns findings list."""
    response = client.get("/documents/DOC-8812-LEASE-06/findings")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 2
    findings = [Finding.model_validate(f) for f in data]
    assert findings[0].source == "forensics"


def test_render_document():
    """Verify GET /documents/{id}/render supports both image/svg and json formats."""
    # SVG render
    res_svg = client.get("/documents/DOC-8812-LAND-01/render?page=1&rev=draft1")
    assert res_svg.status_code == 200
    assert "image/svg+xml" in res_svg.headers.get("content-type", "")
    assert b"<svg" in res_svg.content

    # JSON metadata render
    res_json = client.get(
        "/documents/DOC-8812-LAND-01/render?page=1",
        headers={"Accept": "application/json"},
    )
    assert res_json.status_code == 200
    data = res_json.json()
    assert data["doc_id"] == "DOC-8812-LAND-01"
    assert data["page"] == 1


def test_record_decision():
    """Verify POST /findings/{id}/decision records officer decision."""
    decision_payload = {
        "finding_id": "FND-8812-002",
        "action": "override",
        "reason": "Provisional fire safety renewal receipt verified offline with Fire Department.",
        "officer": "Director_Scrutiny_P2",
        "timestamp": "2026-10-23T02:00:00Z",
    }
    response = client.post("/findings/FND-8812-002/decision", json=decision_payload)
    assert response.status_code == 200
    dec = Decision.model_validate(response.json())
    assert dec.action == "override"
    assert dec.finding_id == "FND-8812-002"

    # Mismatch path ID vs body ID returns 400
    res_err = client.post("/findings/OTHER_ID/decision", json=decision_payload)
    assert res_err.status_code == 400


def test_get_and_patch_rules():
    """Verify GET /rules and PATCH /rules/{id}."""
    res_rules = client.get("/rules")
    assert res_rules.status_code == 200
    rules = [RuleItem.model_validate(r) for r in res_rules.json()]
    assert len(rules) >= 5

    # Check Rule 9: clause_ref is TODO-VERIFY
    for r in rules:
        assert r.clause_ref == "TODO-VERIFY"

    # Patch rule
    patch_res = client.patch(
        "/rules/RULE-LAND-01",
        json={"active": False, "severity": "medium"},
    )
    assert patch_res.status_code == 200
    updated_rule = RuleItem.model_validate(patch_res.json())
    assert updated_rule.active is False
    assert updated_rule.severity == "medium"

    # Restore rule active state
    client.patch("/rules/RULE-LAND-01", json={"active": True, "severity": "high"})


def test_audit_endpoints():
    """Verify GET /audit and GET /audit/verify."""
    res_audit = client.get("/audit")
    assert res_audit.status_code == 200
    entries = [AuditEntry.model_validate(e) for e in res_audit.json()]
    assert len(entries) >= 2

    res_verify = client.get("/audit/verify")
    assert res_verify.status_code == 200
    verification = AuditVerification.model_validate(res_verify.json())
    assert verification.valid is True
    assert verification.chain_length >= 1


def test_metrics_and_dashboard():
    """Verify GET /metrics and GET /dashboard."""
    res_metrics = client.get("/metrics")
    assert res_metrics.status_code == 200
    metrics = MetricsResponse.model_validate(res_metrics.json())
    assert metrics.total_applications >= 2

    res_dash = client.get("/dashboard")
    assert res_dash.status_code == 200
    dash = DashboardStats.model_validate(res_dash.json())
    assert dash.total_applications >= 2
    assert len(dash.recent_activity) >= 1
