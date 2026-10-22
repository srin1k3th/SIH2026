"""
frontend/scripts/build_mock_data.py
Builds complete, realistic mock JSON data adhering to FRONTEND_CONTRACT.md,
loading computed bounding boxes from computed_bboxes.json and calculating a real SHA-256 audit chain.
"""

import json
import hashlib
from pathlib import Path
from datetime import datetime

SCRIPTS_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = SCRIPTS_DIR.parent
SRC_MOCK = FRONTEND_DIR / "src" / "mock"
SRC_MOCK.mkdir(parents=True, exist_ok=True)

BBOX_FILE = SCRIPTS_DIR / "computed_bboxes.json"
if BBOX_FILE.exists():
    with open(BBOX_FILE, "r") as f:
        bboxes = json.load(f)
else:
    bboxes = {}

# ---------------------------------------------------------------------------
# 1. Categories
# ---------------------------------------------------------------------------
CATEGORIES = [
    {
        "id": "cat-eoa",
        "label": "Extension of Approval (EoA)",
        "description": "Annual renewal of approval for existing AICTE-approved technical institutions.",
    },
    {
        "id": "cat-intake",
        "label": "Increase in Intake / Additional Course",
        "description": "Application for increasing student intake quota or adding new engineering branches.",
    },
    {
        "id": "cat-new",
        "label": "Introduction of New Programme",
        "description": "Establishment of new technical campus or integrated polytechnic / engineering college.",
    },
]

# ---------------------------------------------------------------------------
# 2. Checklists per Category
# ---------------------------------------------------------------------------
CHECKLIST_EOA = [
    {
        "doc_type": "land_lease_deed",
        "label": "Land lease deed",
        "required": True,
        "description": "Registered 30-year minimum land lease deed executed with state government or local authority.",
        "document_id": "d_lease",
    },
    {
        "doc_type": "state_noc",
        "label": "NOC from state authority",
        "required": True,
        "description": "Cryptographically signed No Objection Certificate issued by State Higher Education Department.",
        "document_id": "d_noc",
    },
    {
        "doc_type": "fire_safety",
        "label": "Fire safety certificate",
        "required": True,
        "description": "Current valid fire prevention and life safety clearance issued by Chief Fire Officer.",
        "document_id": "d_fire",
    },
    {
        "doc_type": "accreditation",
        "label": "Accreditation certificate",
        "required": True,
        "description": "National Board of Accreditation (NBA) accreditation validity certificate for technical courses.",
        "document_id": "d_accr",
    },
    {
        "doc_type": "registration_cert",
        "label": "Registration certificate",
        "required": True,
        "description": "Trust / Society registration certificate issued by the Charity Commissioner.",
        "document_id": "d_reg",
    },
    {
        "doc_type": "building_plan",
        "label": "Building plan approval (scanned)",
        "required": True,
        "description": "Sanctioned master floor layout and architectural occupancy plan approved by Municipal Corporation.",
        "document_id": "d_plan",
    },
    {
        "doc_type": "affidavit",
        "label": "Affidavit / Undertaking",
        "required": True,
        "description": "Notarized compliance affidavit on non-judicial stamp paper confirming zero fee cap violations.",
        "document_id": None,  # MISSING
    },
]

# ---------------------------------------------------------------------------
# 3. Documents for Application A
# ---------------------------------------------------------------------------
A4_SIZE = [{"width": 595.28, "height": 841.89}]
A4_TWO_PAGES = [{"width": 595.28, "height": 841.89}, {"width": 595.28, "height": 841.89}]

DOC_LEASE = {
    "id": "d_lease",
    "application_id": "APP-2026-0412",
    "doc_type": "land_lease_deed",
    "label": "Land lease deed",
    "filename": "Land_Lease_Deed_Registered.pdf",
    "status": "manual_review_required",
    "uploaded_at": "2026-10-22T08:15:30Z",
    "is_scanned": False,
    "page_sizes": A4_TWO_PAGES,
    "revisions": [
        {
            "rev": 1,
            "label": "Created",
            "saved_at": "2015-06-01T10:00:00Z",
            "producer": "ReportLab PDF Library",
            "is_current": False,
        },
        {
            "rev": 2,
            "label": "Edited",
            "saved_at": "2026-10-20T14:30:00Z",
            "producer": "Microsoft Word for Office 365",
            "is_current": True,
        },
    ],
    "signature": None,
    "verification": {
        "source": "State Land Records Portal (Bhulekh / 7-12)",
        "reference": "MAHA/LND/PUN/2015/8821",
        "requested_at": "2026-10-22T08:16:02Z",
        "result": "manual_review_required",
        "message": "Land records extract indicates 4.2 acres allotted; submitted deed revision specifies 9.2 acres.",
        "submitted_fields": {
            "trust_name": "Shri Ram Educational Trust",
            "survey_no": "SY 214/3B",
            "land_area": "9.2 acres",
            "lease_start": "2015-06-01",
            "lease_end": "2045-05-31",
        },
        "source_fields": {
            "trust_name": "Shri Ram Educational Trust",
            "survey_no": "SY 214/3B",
            "land_area": "4.2 acres",
            "lease_start": "2015-06-01",
            "lease_end": "2045-05-31",
        },
    },
    "fields": [
        {"name": "trust_name", "value": "Shri Ram Educational Trust", "confidence": "high"},
        {"name": "survey_no", "value": "SY 214/3B", "confidence": "high"},
        {"name": "land_area", "value": "9.2 acres", "confidence": "high"},
        {"name": "lease_start", "value": "2015-06-01", "confidence": "high"},
        {"name": "lease_end", "value": "2045-05-31", "confidence": "high"},
        {"name": "signatories", "value": "District Collector, Pune / Fr. Paul Fernandes", "confidence": "high"},
    ],
    "findings": [
        {
            "id": "F-lease-1",
            "doc_id": "d_lease",
            "source": "forensics",
            "type": "TEXT_EDITED_AFTER_CREATION",
            "severity": "high",
            "page": 2,
            "bbox": bboxes.get("F-lease-1", [200.0, 146.0, 258.0, 162.0]),
            "rule_id": "FOR-INCR-01",
            "reason": "Text '9.2 acres' was modified in revision 2 over previous value '4.2 acres'.",
            "evidence": {
                "before": "4.2 acres",
                "after": "9.2 acres",
                "revision": 2,
                "note": "Incremental PDF revision modified textual content in section 3.",
            },
            "confidence": "high",
            "decision": None,
        },
        {
            "id": "F-lease-2",
            "doc_id": "d_lease",
            "source": "forensics",
            "type": "FONT_INCONSISTENCY",
            "severity": "medium",
            "page": 2,
            "bbox": bboxes.get("F-lease-2", [198.0, 144.0, 260.0, 164.0]),
            "rule_id": "FOR-FONT-02",
            "reason": "Font Courier-Bold in modified text differs from the document Helvetica body typeface.",
            "evidence": {
                "before": "Helvetica 10pt",
                "after": "Courier-Bold 10pt",
                "revision": 2,
                "note": "Discrepant embedded font subset detected in numeric land area span.",
            },
            "confidence": "high",
            "decision": None,
        },
        {
            "id": "F-lease-3",
            "doc_id": "d_lease",
            "source": "forensics",
            "type": "PRODUCER_MISMATCH",
            "severity": "low",
            "page": 1,
            "bbox": None,  # Document-level
            "rule_id": "FOR-META-03",
            "reason": "PDF producer changed between revisions: original was 'ReportLab PDF Library', revision 2 is 'Microsoft Word'.",
            "evidence": {
                "before": "ReportLab PDF Library",
                "after": "Microsoft Word for Office 365",
                "revision": 2,
                "note": "Re-saved using external word processor.",
            },
            "confidence": "high",
            "decision": None,
        },
        {
            "id": "F-lease-4",
            "doc_id": "d_lease",
            "source": "crosscheck",
            "type": "CROSSDOC_FIELD_MISMATCH",
            "severity": "high",
            "page": 2,
            "bbox": bboxes.get("F-lease-4", [201.0, 147.0, 257.0, 161.0]),
            "rule_id": "XDOC-AREA-01",
            "reason": "Land area 9.2 acres here vs 4.2 acres declared in State NOC and Registration certificate.",
            "evidence": {
                "before": "4.2 acres (in NOC & Reg Cert)",
                "after": "9.2 acres (in Lease & Application)",
                "note": "Land area 9.2 acres here vs 4.2 acres in NOC and Registration certificate",
            },
            "confidence": "high",
            "decision": None,
        },
    ],
}

DOC_NOC = {
    "id": "d_noc",
    "application_id": "APP-2026-0412",
    "doc_type": "state_noc",
    "label": "NOC from state authority",
    "filename": "State_Authority_NOC_Signed.pdf",
    "status": "verification_pending",
    "uploaded_at": "2026-10-22T08:15:30Z",
    "is_scanned": False,
    "page_sizes": A4_SIZE,
    "revisions": [
        {"rev": 1, "label": "Signed", "saved_at": "2022-05-18T11:42:10Z", "producer": "DigitalSigner Demo CA", "is_current": True}
    ],
    "signature": {
        "present": True,
        "intact": True,
        "valid": True,
        "trusted": True,
        "modification_level": "other",
        "signer": "Under Secretary, Revenue Dept.",
        "signed_at": "2022-05-18T11:42:10+05:30",
    },
    "verification": {
        "source": "Maharashtra Mantralaya e-Governance Registry",
        "reference": "NOC/2022/PK-114",
        "requested_at": "2026-10-22T08:16:03Z",
        "result": "verification_pending",
        "message": "Issuer returned 202: processing verification queue request",
        "submitted_fields": {
            "trust_name": "Sri Ram Educational Trust",
            "survey_no": "SY-214/3B",
            "land_area": "4.2 acres",
        },
        "source_fields": None,
    },
    "fields": [
        {"name": "trust_name", "value": "Sri Ram Educational Trust", "confidence": "high"},
        {"name": "survey_no", "value": "SY-214/3B", "confidence": "high"},
        {"name": "land_area", "value": "4.2 acres", "confidence": "high"},
        {"name": "signatories", "value": "Under Secretary, Higher & Technical Education Dept", "confidence": "high"},
    ],
    "findings": [
        {
            "id": "F-noc-1",
            "doc_id": "d_noc",
            "source": "forensics",
            "type": "MODIFIED_AFTER_SIGNING",
            "severity": "high",
            "page": 1,
            "bbox": bboxes.get("F-noc-1", [70.0, 494.0, 377.0, 512.0]),
            "rule_id": "FOR-SIG-04",
            "reason": "Document content was modified in an unsigned revision after the digital signature was applied.",
            "evidence": {
                "note": "Content changed in a later revision after the signature was applied",
            },
            "confidence": "high",
            "decision": None,
        }
    ],
}

DOC_FIRE = {
    "id": "d_fire",
    "application_id": "APP-2026-0412",
    "doc_type": "fire_safety",
    "label": "Fire safety certificate",
    "filename": "Fire_Safety_Certificate_NOC.pdf",
    "status": "verified",
    "uploaded_at": "2026-10-22T08:15:30Z",
    "is_scanned": False,
    "page_sizes": A4_SIZE,
    "revisions": [
        {"rev": 1, "label": "Original", "saved_at": "2025-04-01T10:00:00Z", "producer": "State Fire Services Portal", "is_current": True}
    ],
    "signature": None,
    "verification": {
        "source": "Mock Issuer: State Fire Services",
        "reference": "FSC/2025/88213",
        "requested_at": "2026-10-22T08:16:04Z",
        "result": "verified",
        "message": "Certificate QR and issuer database records match submitted document perfectly.",
        "submitted_fields": {
            "trust_name": "Shri Ram Educational Trust",
            "cert_valid_from": "2025-04-01",
            "cert_valid_to": "2028-03-31",
            "signatories": "Chief Fire Officer, Municipal Corporation",
        },
        "source_fields": {
            "trust_name": "Shri Ram Educational Trust",
            "cert_valid_from": "2025-04-01",
            "cert_valid_to": "2028-03-31",
            "signatories": "Chief Fire Officer, Municipal Corporation",
        },
    },
    "fields": [
        {"name": "trust_name", "value": "Shri Ram Educational Trust", "confidence": "high"},
        {"name": "cert_valid_from", "value": "2025-04-01", "confidence": "high"},
        {"name": "cert_valid_to", "value": "2028-03-31", "confidence": "high"},
        {"name": "signatories", "value": "Chief Fire Officer, Municipal Corporation", "confidence": "high"},
    ],
    "findings": [],
}

DOC_ACCR = {
    "id": "d_accr",
    "application_id": "APP-2026-0412",
    "doc_type": "accreditation",
    "label": "Accreditation certificate",
    "filename": "Accreditation_Certificate_NBA.pdf",
    "status": "mismatch_detected",
    "uploaded_at": "2026-10-22T08:15:30Z",
    "is_scanned": False,
    "page_sizes": A4_SIZE,
    "revisions": [
        {"rev": 1, "label": "Original", "saved_at": "2022-04-01T09:00:00Z", "producer": "National Accreditation Portal", "is_current": True}
    ],
    "signature": None,
    "verification": {
        "source": "National Accreditation Board (NBA API)",
        "reference": "NBA/2022/94101",
        "requested_at": "2026-10-22T08:16:04Z",
        "result": "mismatch_detected",
        "message": "Validity date mismatch: submitted document indicates 31-03-2027; official issuer registry records 31-03-2025.",
        "submitted_fields": {
            "trust_name": "Shri Ram Educational Trust",
            "cert_valid_from": "2022-04-01",
            "cert_valid_to": "31-03-2027",
        },
        "source_fields": {
            "trust_name": "Shri Ram Educational Trust",
            "cert_valid_from": "2022-04-01",
            "cert_valid_to": "31-03-2025",
        },
    },
    "fields": [
        {"name": "trust_name", "value": "Shri Ram Educational Trust", "confidence": "high"},
        {"name": "cert_valid_from", "value": "2022-04-01", "confidence": "high"},
        {"name": "cert_valid_to", "value": "31-03-2027", "confidence": "high"},
        {"name": "signatories", "value": "Member Secretary, Accreditation Board", "confidence": "high"},
    ],
    "findings": [
        {
            "id": "F-accr-1",
            "doc_id": "d_accr",
            "source": "issuer",
            "type": "ISSUER_MISMATCH",
            "severity": "high",
            "page": 1,
            "bbox": bboxes.get("F-accr-1", [210.0, 335.0, 265.0, 353.0]),
            "rule_id": "ISS-MISMATCH-01",
            "reason": "Accreditation validity date discrepancy: submitted document claims 31-03-2027, but official NBA issuer registry records expired validity of 31-03-2025.",
            "evidence": {
                "before": "Submitted: 31-03-2027",
                "after": "Issuer record: 31-03-2025",
                "note": "Authority registry crosscheck confirms 2-year discrepancy.",
            },
            "confidence": "high",
            "decision": None,
        }
    ],
}

DOC_REG = {
    "id": "d_reg",
    "application_id": "APP-2026-0412",
    "doc_type": "registration_cert",
    "label": "Registration certificate",
    "filename": "Trust_Registration_Certificate.pdf",
    "status": "expired",
    "uploaded_at": "2026-10-22T08:15:30Z",
    "is_scanned": False,
    "page_sizes": A4_SIZE,
    "revisions": [
        {"rev": 1, "label": "Original", "saved_at": "2004-01-12T10:00:00Z", "producer": "Charity Commissioner Office", "is_current": True}
    ],
    "signature": None,
    "verification": {
        "source": "Public Trusts Registration Office, Pune",
        "reference": "F-18492/Pune",
        "requested_at": "2026-10-22T08:16:05Z",
        "result": "expired",
        "message": "Society periodic renewal term expired on 31-12-2023. No active renewal certificate on file.",
        "submitted_fields": {
            "trust_name": "Shri Ram Educational Trust",
            "survey_no": "SY 214/3B",
            "land_area": "4.2 acres",
            "cert_valid_to": "31-12-2023",
        },
        "source_fields": {
            "trust_name": "Shri Ram Educational Trust",
            "survey_no": "SY 214/3B",
            "land_area": "4.2 acres",
            "cert_valid_to": "31-12-2023",
        },
    },
    "fields": [
        {"name": "trust_name", "value": "Shri Ram Educational Trust", "confidence": "high"},
        {"name": "survey_no", "value": "SY 214/3B", "confidence": "high"},
        {"name": "land_area", "value": "4.2 acres", "confidence": "high"},
        {"name": "cert_valid_to", "value": "31-12-2023", "confidence": "high"},
        {"name": "signatories", "value": "Assistant Charity Commissioner, Pune", "confidence": "high"},
    ],
    "findings": [
        {
            "id": "F-reg-1",
            "doc_id": "d_reg",
            "source": "rules",
            "type": "DOC_EXPIRED",
            "severity": "medium",
            "page": 1,
            "bbox": bboxes.get("F-reg-1", [432.0, 367.0, 542.0, 385.0]),
            "rule_id": "RUL-EXP-01",
            "reason": "Trust registration renewal expired on 31-12-2023. Current regulatory clearance is required for approval.",
            "evidence": {
                "before": "Valid until: 31-12-2023",
                "after": "Current date: 2026-10-23",
                "note": "Document expired before application submission date.",
            },
            "confidence": "high",
            "decision": None,
        }
    ],
}

DOC_PLAN = {
    "id": "d_plan",
    "application_id": "APP-2026-0412",
    "doc_type": "building_plan",
    "label": "Building plan approval (scanned)",
    "filename": "Sanctioned_Building_Plan_Approval.pdf",
    "status": "source_unavailable",
    "uploaded_at": "2026-10-22T08:15:30Z",
    "is_scanned": True,
    "page_sizes": A4_SIZE,
    "revisions": [
        {"rev": 1, "label": "Scanned", "saved_at": "2021-08-14T15:20:00Z", "producer": "ImageScan Flatbed v4", "is_current": True}
    ],
    "signature": None,
    "verification": {
        "source": "Municipal Town Planning Portal",
        "reference": "TP/SANCTION/2021/4192",
        "requested_at": "2026-10-22T08:16:05Z",
        "result": "source_unavailable",
        "message": "Municipal verification portal timed out (HTTP 503 Service Unavailable). Live verification failed.",
        "submitted_fields": {
            "trust_name": "Shri Ram Educational Trust",
            "survey_no": "SY 214/3B",
        },
        "source_fields": None,
    },
    "fields": [
        {"name": "trust_name", "value": "Shri Ram Educational Trust", "confidence": "medium"},
        {"name": "survey_no", "value": "SY 214/3B", "confidence": "medium"},
    ],
    "findings": [
        {
            "id": "F-plan-1",
            "doc_id": "d_plan",
            "source": "rules",
            "type": "LOW_OCR_CONFIDENCE",
            "severity": "low",
            "page": 1,
            "bbox": bboxes.get("F-plan-1", [340.0, 550.0, 510.0, 670.0]),
            "rule_id": "OCR-CONF-01",
            "reason": "Town planning sanction stamp region has low OCR extraction confidence (58% vs required 70% threshold).",
            "evidence": {
                "note": "OCR confidence on town planning seal is 58% (< threshold 70%)",
            },
            "confidence": "low",
            "decision": None,
        }
    ],
}

# ---------------------------------------------------------------------------
# 4. Crosscheck Matrix for Application A
# ---------------------------------------------------------------------------
CROSSCHECK_MATRIX_A = {
    "fields": [
        {"id": "trust_name", "label": "Trust / Society Name"},
        {"id": "survey_no", "label": "Land Survey Number"},
        {"id": "land_area", "label": "Total Land Area"},
        {"id": "lease_start", "label": "Lease Start Date"},
        {"id": "lease_end", "label": "Lease End Date"},
        {"id": "signatories", "label": "Signatory Authorities"},
    ],
    "sources": [
        {"id": "application", "label": "Application Form"},
        {"id": "d_lease", "label": "Land Lease Deed"},
        {"id": "d_noc", "label": "State NOC"},
        {"id": "d_reg", "label": "Registration Cert"},
    ],
    "cells": {
        "land_area": {
            "application": {"value": "9.2 acres", "normalized": "37,231 sq m", "match": False, "note": "Differs from majority (4.2 acres)"},
            "d_lease": {
                "value": "9.2 acres",
                "normalized": "37,231 sq m",
                "match": False,
                "note": "Land area 9.2 acres here vs 4.2 acres in NOC and Registration certificate",
                "finding_id": "F-lease-4",
            },
            "d_noc": {"value": "4.2 acres", "normalized": "16,997 sq m", "match": True},
            "d_reg": {"value": "4.2 acres", "normalized": "16,997 sq m", "match": True},
        },
        "trust_name": {
            "application": {"value": "Shri Ram Educational Trust", "normalized": "shri ram educational trust", "match": True},
            "d_lease": {"value": "Shri Ram Educational Trust", "normalized": "shri ram educational trust", "match": True},
            "d_noc": {
                "value": "Sri Ram Educational Trust",
                "normalized": "sri ram educational trust",
                "match": True,
                "note": "Fuzzy match 0.96: spelling variant",
            },
            "d_reg": {"value": "Shri Ram Educational Trust", "normalized": "shri ram educational trust", "match": True},
        },
        "survey_no": {
            "application": {"value": "SY 214/3B", "normalized": "SY214/3B", "match": True},
            "d_lease": {"value": "SY 214/3B", "normalized": "SY214/3B", "match": True},
            "d_noc": {"value": "SY-214/3B", "normalized": "SY214/3B", "match": True, "note": "Punctuation normalized"},
            "d_reg": {"value": "SY 214/3B", "normalized": "SY214/3B", "match": True},
        },
        "lease_start": {
            "application": {"value": "01-06-2015", "normalized": "2015-06-01", "match": True},
            "d_lease": {"value": "01-06-2015", "normalized": "2015-06-01", "match": True},
            "d_noc": {"value": None, "normalized": None, "match": True},
            "d_reg": {"value": None, "normalized": None, "match": True},
        },
        "lease_end": {
            "application": {"value": "31-05-2045", "normalized": "2045-05-31", "match": True},
            "d_lease": {"value": "31-05-2045", "normalized": "2045-05-31", "match": True},
            "d_noc": {"value": None, "normalized": None, "match": True},
            "d_reg": {"value": None, "normalized": None, "match": True},
        },
        "signatories": {
            "application": {"value": "Fr. Paul Fernandes", "normalized": "paul fernandes", "match": True},
            "d_lease": {"value": "Collector Pune / Fr. Paul Fernandes", "normalized": "collector pune paul fernandes", "match": True},
            "d_noc": {"value": "Under Secretary, Revenue Dept.", "normalized": "under secretary revenue dept", "match": True},
            "d_reg": {"value": "Asst. Charity Commissioner", "normalized": "asst charity commissioner", "match": True},
        },
    },
}

# ---------------------------------------------------------------------------
# 5. Verification Log for Application A
# ---------------------------------------------------------------------------
VERIFICATION_LOG_A = [
    {
        "id": "VER-001",
        "doc_id": "d_lease",
        "doc_label": "Land lease deed",
        "source": "State Land Records Portal (Bhulekh / 7-12)",
        "reference": "MAHA/LND/PUN/2015/8821",
        "requested_at": "2026-10-22T08:16:02Z",
        "status": "manual_review_required",
        "message": "Land records extract indicates 4.2 acres allotted; submitted deed revision specifies 9.2 acres.",
    },
    {
        "id": "VER-002",
        "doc_id": "d_noc",
        "doc_label": "NOC from state authority",
        "source": "Maharashtra Mantralaya e-Governance Registry",
        "reference": "NOC/2022/PK-114",
        "requested_at": "2026-10-22T08:16:03Z",
        "status": "verification_pending",
        "message": "Issuer returned 202: processing verification queue request",
    },
    {
        "id": "VER-003",
        "doc_id": "d_fire",
        "doc_label": "Fire safety certificate",
        "source": "Mock Issuer: State Fire Services",
        "reference": "FSC/2025/88213",
        "requested_at": "2026-10-22T08:16:04Z",
        "status": "verified",
        "message": "Certificate QR and issuer database records match submitted document perfectly.",
    },
    {
        "id": "VER-004",
        "doc_id": "d_accr",
        "doc_label": "Accreditation certificate",
        "source": "National Accreditation Board (NBA API)",
        "reference": "NBA/2022/94101",
        "requested_at": "2026-10-22T08:16:04Z",
        "status": "mismatch_detected",
        "message": "Validity date mismatch: submitted document indicates 31-03-2027; official issuer registry records 31-03-2025.",
    },
    {
        "id": "VER-005",
        "doc_id": "d_reg",
        "doc_label": "Registration certificate",
        "source": "Public Trusts Registration Office, Pune",
        "reference": "F-18492/Pune",
        "requested_at": "2026-10-22T08:16:05Z",
        "status": "expired",
        "message": "Society periodic renewal term expired on 31-12-2023. No active renewal certificate on file.",
    },
    {
        "id": "VER-006",
        "doc_id": "d_plan",
        "doc_label": "Building plan approval (scanned)",
        "source": "Municipal Town Planning Portal",
        "reference": "TP/SANCTION/2021/4192",
        "requested_at": "2026-10-22T08:16:05Z",
        "status": "source_unavailable",
        "message": "Municipal verification portal timed out (HTTP 503 Service Unavailable). Live verification failed.",
    },
]

# ---------------------------------------------------------------------------
# 6. Global Alerts
# ---------------------------------------------------------------------------
ALERTS_A = [
    {
        "id": "ALT-001",
        "application_id": "APP-2026-0412",
        "doc_id": "d_reg",
        "kind": "expired",
        "message": "Trust Registration certificate expired on 31-12-2023. Valid renewal required.",
        "due_date": "2026-11-05",
        "severity": "medium",
    },
    {
        "id": "ALT-002",
        "application_id": "APP-2026-0412",
        "doc_id": "d_accr",
        "kind": "anomaly",
        "message": "NBA Accreditation certificate validity mismatch against central issuer registry.",
        "due_date": "2026-10-30",
        "severity": "high",
    },
    {
        "id": "ALT-003",
        "application_id": "APP-2026-0412",
        "doc_id": "d_noc",
        "kind": "pending_verification",
        "message": "State Government NOC digital certificate verification pending (HTTP 202).",
        "due_date": "2026-10-28",
        "severity": "high",
    },
    {
        "id": "ALT-004",
        "application_id": "APP-2026-0412",
        "doc_id": None,
        "kind": "missing",
        "message": "Mandatory statutory document 'Affidavit / Undertaking' is missing from submission.",
        "due_date": "2026-10-27",
        "severity": "high",
    },
    {
        "id": "ALT-005",
        "application_id": "APP-2026-0219",
        "doc_id": "d_meridian_cert",
        "kind": "expiring",
        "message": "Building Safety Clearance certificate expiring in 25 days (17-11-2026).",
        "due_date": "2026-11-17",
        "severity": "medium",
    },
]

# ---------------------------------------------------------------------------
# 7. Application Details & Summaries
# ---------------------------------------------------------------------------
APP_A_DETAIL = {
    "id": "APP-2026-0412",
    "institution": "Sample Institute of Technology",
    "category_id": "cat-eoa",
    "category_label": "Extension of Approval (EoA)",
    "submitted_at": "2026-10-22T08:15:30Z",
    "risk_score": 78,
    "doc_count": 6,
    "status_counts": {
        "manual_review_required": 1,
        "verification_pending": 1,
        "verified": 1,
        "mismatch_detected": 1,
        "expired": 1,
        "source_unavailable": 1,
    },
    "flag_counts": {"high": 4, "medium": 2, "low": 2},
    "has_missing": True,
    "checklist": CHECKLIST_EOA,
    "documents": [DOC_LEASE, DOC_NOC, DOC_FIRE, DOC_ACCR, DOC_REG, DOC_PLAN],
    "crosscheck": CROSSCHECK_MATRIX_A,
    "verification_log": VERIFICATION_LOG_A,
    "alerts": ALERTS_A[:4],
}

# Application B: Clean Valley Polytechnic
DOC_CLEAN_1 = {
    "id": "d_clean_land",
    "application_id": "APP-2026-0398",
    "doc_type": "land_lease_deed",
    "label": "Government Land Allotment Order",
    "filename": "Clean_Land_Allotment_Deed.pdf",
    "status": "verified",
    "uploaded_at": "2026-10-21T09:00:00Z",
    "is_scanned": False,
    "page_sizes": A4_SIZE,
    "revisions": [{"rev": 1, "label": "Original", "saved_at": "2010-01-01T10:00:00Z", "producer": "ReportLab PDF", "is_current": True}],
    "signature": None,
    "verification": {
        "source": "State Land Portal",
        "reference": "GOV/ALLOT/2010/88",
        "requested_at": "2026-10-21T09:01:00Z",
        "result": "verified",
        "message": "Allotment deed verified with District Collectorate.",
        "submitted_fields": {"trust_name": "Clean Valley Educational Foundation", "land_area": "25,000 sq m"},
        "source_fields": {"trust_name": "Clean Valley Educational Foundation", "land_area": "25,000 sq m"},
    },
    "fields": [
        {"name": "trust_name", "value": "Clean Valley Educational Foundation", "confidence": "high"},
        {"name": "land_area", "value": "25,000 sq m", "confidence": "high"},
    ],
    "findings": [],
}

DOC_CLEAN_2 = {
    "id": "d_clean_bldg",
    "application_id": "APP-2026-0398",
    "doc_type": "building_plan",
    "label": "Building Completion Certificate",
    "filename": "PWD_Building_Completion_Cert.pdf",
    "status": "verified",
    "uploaded_at": "2026-10-21T09:00:00Z",
    "is_scanned": False,
    "page_sizes": A4_SIZE,
    "revisions": [{"rev": 1, "label": "Original", "saved_at": "2018-05-10T10:00:00Z", "producer": "ReportLab PDF", "is_current": True}],
    "signature": None,
    "verification": {
        "source": "PWD Building Authority",
        "reference": "PWD/OCC/2018/412",
        "requested_at": "2026-10-21T09:01:00Z",
        "result": "verified",
        "message": "Certificate confirmed valid.",
        "submitted_fields": {"trust_name": "Clean Valley Educational Foundation"},
        "source_fields": {"trust_name": "Clean Valley Educational Foundation"},
    },
    "fields": [{"name": "trust_name", "value": "Clean Valley Educational Foundation", "confidence": "high"}],
    "findings": [],
}

DOC_CLEAN_3 = {
    "id": "d_clean_fire",
    "application_id": "APP-2026-0398",
    "doc_type": "fire_safety",
    "label": "Fire Safety Clearance",
    "filename": "Fire_Safety_Clearance_2026.pdf",
    "status": "verified",
    "uploaded_at": "2026-10-21T09:00:00Z",
    "is_scanned": False,
    "page_sizes": A4_SIZE,
    "revisions": [{"rev": 1, "label": "Original", "saved_at": "2026-01-15T10:00:00Z", "producer": "ReportLab PDF", "is_current": True}],
    "signature": None,
    "verification": {
        "source": "Municipal Fire Service Headquarters",
        "reference": "FIRE/NOC/2026/19420",
        "requested_at": "2026-10-21T09:01:00Z",
        "result": "verified",
        "message": "Active clearance verified.",
        "submitted_fields": {"cert_valid_to": "14-01-2029"},
        "source_fields": {"cert_valid_to": "14-01-2029"},
    },
    "fields": [{"name": "cert_valid_to", "value": "14-01-2029", "confidence": "high"}],
    "findings": [],
}

DOC_CLEAN_4 = {
    "id": "d_clean_aicte",
    "application_id": "APP-2026-0398",
    "doc_type": "accreditation",
    "label": "AICTE Prior Approval Extension",
    "filename": "AICTE_EOA_Extension_Report.pdf",
    "status": "verified",
    "uploaded_at": "2026-10-21T09:00:00Z",
    "is_scanned": False,
    "page_sizes": A4_SIZE,
    "revisions": [{"rev": 1, "label": "Original", "saved_at": "2025-06-01T10:00:00Z", "producer": "ReportLab PDF", "is_current": True}],
    "signature": None,
    "verification": {
        "source": "AICTE Central Portal",
        "reference": "AICTE/EOA/2025/1-492",
        "requested_at": "2026-10-21T09:01:00Z",
        "result": "verified",
        "message": "Approval record verified in national portal.",
        "submitted_fields": {"trust_name": "Clean Valley Educational Foundation"},
        "source_fields": {"trust_name": "Clean Valley Educational Foundation"},
    },
    "fields": [{"name": "trust_name", "value": "Clean Valley Educational Foundation", "confidence": "high"}],
    "findings": [],
}

APP_B_DETAIL = {
    "id": "APP-2026-0398",
    "institution": "Clean Valley Polytechnic",
    "category_id": "cat-eoa",
    "category_label": "Extension of Approval (EoA)",
    "submitted_at": "2026-10-21T09:00:00Z",
    "risk_score": 0,
    "doc_count": 4,
    "status_counts": {"verified": 4},
    "flag_counts": {"high": 0, "medium": 0, "low": 0},
    "has_missing": False,
    "checklist": [
        {"doc_type": "land_lease_deed", "label": "Land lease deed", "required": True, "description": "Land title deed", "document_id": "d_clean_land"},
        {"doc_type": "building_plan", "label": "Building completion certificate", "required": True, "description": "Building occupancy", "document_id": "d_clean_bldg"},
        {"doc_type": "fire_safety", "label": "Fire safety certificate", "required": True, "description": "Fire clearance", "document_id": "d_clean_fire"},
        {"doc_type": "accreditation", "label": "AICTE Prior approval", "required": True, "description": "Prior approval", "document_id": "d_clean_aicte"},
    ],
    "documents": [DOC_CLEAN_1, DOC_CLEAN_2, DOC_CLEAN_3, DOC_CLEAN_4],
    "crosscheck": {
        "fields": [{"id": "trust_name", "label": "Trust Name"}, {"id": "land_area", "label": "Land Area"}],
        "sources": [{"id": "application", "label": "Application"}, {"id": "d_clean_land", "label": "Land Deed"}],
        "cells": {
            "trust_name": {
                "application": {"value": "Clean Valley Educational Foundation", "normalized": "clean valley", "match": True},
                "d_clean_land": {"value": "Clean Valley Educational Foundation", "normalized": "clean valley", "match": True},
            },
            "land_area": {
                "application": {"value": "25,000 sq m", "normalized": "25000", "match": True},
                "d_clean_land": {"value": "25,000 sq m", "normalized": "25000", "match": True},
            },
        },
    },
    "verification_log": [
        {
            "id": "VER-B-01",
            "doc_id": "d_clean_land",
            "doc_label": "Government Land Allotment Order",
            "source": "State Land Portal",
            "reference": "GOV/ALLOT/2010/88",
            "requested_at": "2026-10-21T09:01:00Z",
            "status": "verified",
            "message": "Allotment deed verified with District Collectorate.",
        }
    ],
    "alerts": [],
}

# Applications C, D, E
APP_C_DETAIL = {
    "id": "APP-2026-0219",
    "institution": "Meridian Institute of Management",
    "category_id": "cat-intake",
    "category_label": "Increase in Intake / Additional Course",
    "submitted_at": "2026-10-20T11:45:00Z",
    "risk_score": 41,
    "doc_count": 5,
    "status_counts": {"verified": 3, "expired": 1, "manual_review_required": 1},
    "flag_counts": {"high": 2, "medium": 1, "low": 2},
    "has_missing": False,
    "checklist": [],
    "documents": [],
    "crosscheck": {"fields": [], "sources": [], "cells": {}},
    "verification_log": [],
    "alerts": [ALERTS_A[4]],
}

APP_D_DETAIL = {
    "id": "APP-2026-0155",
    "institution": "Kaveri College of Engineering",
    "category_id": "cat-eoa",
    "category_label": "Extension of Approval (EoA)",
    "submitted_at": "2026-10-19T14:20:00Z",
    "risk_score": 22,
    "doc_count": 6,
    "status_counts": {"verified": 4, "verification_pending": 1, "mismatch_detected": 1},
    "flag_counts": {"high": 1, "medium": 1, "low": 0},
    "has_missing": False,
    "checklist": [],
    "documents": [],
    "crosscheck": {"fields": [], "sources": [], "cells": {}},
    "verification_log": [],
    "alerts": [],
}

APP_E_DETAIL = {
    "id": "APP-2026-0112",
    "institution": "Lakshmi Polytechnic",
    "category_id": "cat-new",
    "category_label": "Introduction of New Programme",
    "submitted_at": "2026-10-18T16:10:00Z",
    "risk_score": 9,
    "doc_count": 4,
    "status_counts": {"verified": 3, "manual_review_required": 1},
    "flag_counts": {"high": 0, "medium": 1, "low": 1},
    "has_missing": False,
    "checklist": [],
    "documents": [],
    "crosscheck": {"fields": [], "sources": [], "cells": {}},
    "verification_log": [],
    "alerts": [],
}

ALL_APPLICATION_DETAILS = {
    "APP-2026-0412": APP_A_DETAIL,
    "APP-2026-0398": APP_B_DETAIL,
    "APP-2026-0219": APP_C_DETAIL,
    "APP-2026-0155": APP_D_DETAIL,
    "APP-2026-0112": APP_E_DETAIL,
}

ALL_APPLICATION_SUMMARIES = [
    {
        "id": app["id"],
        "institution": app["institution"],
        "category_id": app["category_id"],
        "category_label": app["category_label"],
        "submitted_at": app["submitted_at"],
        "risk_score": app["risk_score"],
        "doc_count": app["doc_count"],
        "status_counts": app["status_counts"],
        "flag_counts": app["flag_counts"],
        "has_missing": app["has_missing"],
    }
    for app in ALL_APPLICATION_DETAILS.values()
]

# ---------------------------------------------------------------------------
# 8. Rules (10 rules with clause_ref: "TODO-VERIFY")
# ---------------------------------------------------------------------------
RULES = [
    {
        "id": "LEASE-MIN-TERM",
        "title": "Minimum 30-Year Registered Lease Term",
        "description": "Where institutional land is leased from government or local body, lease agreement must be executed for a minimum continuous period of 30 years.",
        "clause_ref": "TODO-VERIFY",
        "severity": "high",
        "category_ids": ["cat-eoa", "cat-new"],
        "enabled": True,
        "threshold": {"label": "Minimum Term", "value": 30, "unit": "years"},
        "last_run_hits": 0,
    },
    {
        "id": "RUL-EXP-01",
        "title": "Certificate Unexpired at Application Date",
        "description": "All statutory certificates including Fire Safety NOC, Trust Registration, and Building Occupancy must remain unexpired on application date.",
        "clause_ref": "TODO-VERIFY",
        "severity": "medium",
        "category_ids": ["cat-eoa", "cat-intake", "cat-new"],
        "enabled": True,
        "threshold": None,
        "last_run_hits": 1,
    },
    {
        "id": "XDOC-AREA-01",
        "title": "Cross-Document Land Area Consistency",
        "description": "Total land area stated across land deed, building permission, and application form must match with zero discrepancy.",
        "clause_ref": "TODO-VERIFY",
        "severity": "high",
        "category_ids": ["cat-eoa", "cat-new"],
        "enabled": True,
        "threshold": None,
        "last_run_hits": 1,
    },
    {
        "id": "FOR-INCR-01",
        "title": "Incremental Revision Content Alteration",
        "description": "Detects subsequent PDF trailer updates altering visible alphanumeric text or numeric quantities.",
        "clause_ref": "TODO-VERIFY",
        "severity": "high",
        "category_ids": ["cat-eoa", "cat-intake", "cat-new"],
        "enabled": True,
        "threshold": None,
        "last_run_hits": 1,
    },
    {
        "id": "FOR-FONT-02",
        "title": "Embedded Font Typeface Inconsistency",
        "description": "Detects localized font subset divergence indicative of spliced or digitally overwritten numeric fields.",
        "clause_ref": "TODO-VERIFY",
        "severity": "medium",
        "category_ids": ["cat-eoa", "cat-intake", "cat-new"],
        "enabled": True,
        "threshold": None,
        "last_run_hits": 1,
    },
    {
        "id": "FOR-META-03",
        "title": "PDF Producer & Modification Anomaly",
        "description": "Flags documents where PDF producer software changes between revisions or modification date precedes creation.",
        "clause_ref": "TODO-VERIFY",
        "severity": "low",
        "category_ids": ["cat-eoa", "cat-intake", "cat-new"],
        "enabled": True,
        "threshold": None,
        "last_run_hits": 1,
    },
    {
        "id": "FOR-SIG-04",
        "title": "Content Modification After Digital Sealing",
        "description": "Flags PDF documents containing incremental updates that modify substantive content following digital certificate attestation.",
        "clause_ref": "TODO-VERIFY",
        "severity": "high",
        "category_ids": ["cat-eoa", "cat-intake", "cat-new"],
        "enabled": True,
        "threshold": None,
        "last_run_hits": 1,
    },
    {
        "id": "ISS-MISMATCH-01",
        "title": "Issuing Authority Live Registry Discrepancy",
        "description": "Cross-references accreditation validity dates and certification numbers against national authority databases.",
        "clause_ref": "TODO-VERIFY",
        "severity": "high",
        "category_ids": ["cat-eoa", "cat-intake"],
        "enabled": True,
        "threshold": None,
        "last_run_hits": 1,
    },
    {
        "id": "OCR-CONF-01",
        "title": "Minimum OCR Extraction Confidence Threshold",
        "description": "Flags scanned documents where town planning stamp or sanction seal optical recognition falls below confidence threshold.",
        "clause_ref": "TODO-VERIFY",
        "severity": "low",
        "category_ids": ["cat-eoa", "cat-new"],
        "enabled": True,
        "threshold": {"label": "Confidence Threshold", "value": 70, "unit": "%"},
        "last_run_hits": 1,
    },
    {
        "id": "REQ-DOC-01",
        "title": "Mandatory Statutory Document Checklist",
        "description": "Mandates that all required statutory documents specified for the category are present in the application package.",
        "clause_ref": "TODO-VERIFY",
        "severity": "high",
        "category_ids": ["cat-eoa", "cat-intake", "cat-new"],
        "enabled": True,
        "threshold": None,
        "last_run_hits": 1,
    },
]

# ---------------------------------------------------------------------------
# 9. Audit Events (14 events with REAL SHA-256 hash chain)
# ---------------------------------------------------------------------------
AUDIT_RAW = [
    {"actor": "system", "role": "officer", "action": "SYSTEM_GENESIS", "target": "ROOT", "detail": "VeriAPH Audit Hash Chain initialized.", "timestamp": "2026-10-21T08:00:00Z"},
    {"actor": "Registrar Office", "role": "institution", "action": "APPLICATION_SUBMITTED", "target": "APP-2026-0398", "detail": "Clean Valley Polytechnic submitted EoA application.", "timestamp": "2026-10-21T09:00:00Z"},
    {"actor": "system_orchestrator", "role": "officer", "action": "PIPELINE_VALIDATE", "target": "APP-2026-0398", "detail": "Automated verification completed: 0 findings, risk 0.", "timestamp": "2026-10-21T09:01:15Z"},
    {"actor": "Registrar Office", "role": "institution", "action": "APPLICATION_SUBMITTED", "target": "APP-2026-0412", "detail": "Sample Institute of Technology submitted EoA application with 6 documents.", "timestamp": "2026-10-22T08:15:30Z"},
    {"actor": "system_orchestrator", "role": "officer", "action": "PIPELINE_VALIDATE", "target": "APP-2026-0412", "detail": "Validation completed: 8 findings flagged, risk score 78.", "timestamp": "2026-10-22T08:16:10Z"},
    {"actor": "Demo Officer", "role": "officer", "action": "DOC_REVIEW_OPENED", "target": "d_lease", "detail": "Officer opened Land Lease Deed inspection canvas.", "timestamp": "2026-10-22T09:10:00Z"},
    {"actor": "Demo Officer", "role": "officer", "action": "FINDING_INSPECTED", "target": "F-lease-1", "detail": "Inspected Text Alteration on Page 2 (4.2 -> 9.2 acres).", "timestamp": "2026-10-22T09:12:30Z"},
    {"actor": "Demo Officer", "role": "officer", "action": "FINDING_DECISION", "target": "F-lease-1", "detail": "Decision recorded: clarify. Reason: Clarification requested regarding land area difference.", "timestamp": "2026-10-22T09:14:45Z"},
    {"actor": "Demo Officer", "role": "officer", "action": "RULE_THRESHOLD_EDITED", "target": "LEASE-MIN-TERM", "detail": "Threshold updated from 30 to 30 years.", "timestamp": "2026-10-22T10:05:00Z"},
    {"actor": "system_orchestrator", "role": "officer", "action": "ISSUER_REGISTRY_POLL", "target": "d_noc", "detail": "Polled Mantralaya e-Governance Registry: returned status 202 Processing.", "timestamp": "2026-10-22T10:30:00Z"},
    {"actor": "Demo Officer", "role": "officer", "action": "REPORT_EXPORT_TRIGGERED", "target": "APP-2026-0412", "detail": "Generated scrutiny summary PDF report.", "timestamp": "2026-10-22T11:00:00Z"},
    {"actor": "Registrar Office", "role": "institution", "action": "APPLICATION_SUBMITTED", "target": "APP-2026-0219", "detail": "Meridian Institute submitted intake expansion request.", "timestamp": "2026-10-22T11:45:00Z"},
    {"actor": "system_orchestrator", "role": "officer", "action": "PIPELINE_VALIDATE", "target": "APP-2026-0219", "detail": "Validation completed: 5 findings, risk score 41.", "timestamp": "2026-10-22T11:46:12Z"},
    {"actor": "Demo Officer", "role": "officer", "action": "AUDIT_CHAIN_VERIFY", "target": "CHAIN", "detail": "Officer executed cryptographic audit chain integrity check.", "timestamp": "2026-10-23T02:00:00Z"},
]

AUDIT_EVENTS = []
prev_hash = "0" * 64

for idx, ev in enumerate(AUDIT_RAW, start=1):
    payload = {
        "seq": idx,
        "timestamp": ev["timestamp"],
        "actor": ev["actor"],
        "role": ev["role"],
        "action": ev["action"],
        "target": ev["target"],
        "detail": ev["detail"],
        "prev_hash": prev_hash,
    }
    # Canonical JSON string: sorted keys, no whitespace
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    h = hashlib.sha256((prev_hash + canonical).encode("utf-8")).hexdigest()
    event_entry = {**payload, "hash": h}
    AUDIT_EVENTS.append(event_entry)
    prev_hash = h

AUDIT_VERIFY = {
    "valid": True,
    "checked": len(AUDIT_EVENTS),
    "first_broken_seq": None,
}

# ---------------------------------------------------------------------------
# 10. Explanations for "Why flagged?"
# ---------------------------------------------------------------------------
EXPLANATIONS = {
    "F-lease-1": {
        "finding_id": "F-lease-1",
        "status": "ok",
        "text": "The document text stream exhibits an incremental PDF update modifying object stream 42. Visual bounding box analysis indicates the string '9.2 acres' replaces '4.2 acres' in revision 2 without authorized re-attestation.",
        "citations": [
            {
                "clause_ref": "APH-2026-IV.3",
                "snippet": "Clause IV.3: Minimum land requirement must be established through authentic registered title deeds possessing un-tampered demarcated spatial measurements.",
            }
        ],
    },
    "F-lease-2": {
        "finding_id": "F-lease-2",
        "status": "ok",
        "text": "The typeface embedded inside the numeric area span is Courier-Bold (monospaced), whereas the contextual parent paragraph is rendered in proportional Helvetica 10pt.",
        "citations": [
            {
                "clause_ref": "APH-2026-IV.3",
                "snippet": "Clause IV.3: Authenticity of legal conveyances and sub-registrar certified annexures.",
            }
        ],
    },
    "F-lease-3": {
        "finding_id": "F-lease-3",
        "status": "ok",
        "text": "PDF document metadata indicates a creator tool transformation from the registered municipal 'ReportLab' library to an external desktop editor 'Microsoft Word'.",
        "citations": [],
    },
    "F-lease-4": {
        "finding_id": "F-lease-4",
        "status": "ok",
        "text": "Cross-document consistency engine identified conflicting land area values across the application package: 9.2 acres claimed in Lease Deed vs 4.2 acres confirmed in State NOC and Registration Certificate.",
        "citations": [
            {
                "clause_ref": "APH-2026-I.2",
                "snippet": "Clause I.2: Inter-document field consistency across all submitted statutory clearances.",
            }
        ],
    },
    "F-noc-1": {
        "finding_id": "F-noc-1",
        "status": "ok",
        "text": "Digital signature verification confirmed the cryptographic seal was applied on 18-05-2022. However, incremental byte analysis reveals substantive body text was modified in a later revision post-sealing.",
        "citations": [
            {
                "clause_ref": "APH-2026-II.1",
                "snippet": "Clause II.1: Digital signatures must remain unmodified; post-signature alterations invalidate statutory clearance.",
            }
        ],
    },
    "F-accr-1": {
        "finding_id": "F-accr-1",
        "status": "ok",
        "text": "Live registry query against the National Accreditation Board records confirmed accreditation expired on 31-03-2025, conflicting with the 31-03-2027 date printed on the submitted certificate.",
        "citations": [
            {
                "clause_ref": "APH-2026-III.4",
                "snippet": "Clause III.4: Technical courses requiring NBA accreditation must possess active validity spanning the academic approval year.",
            }
        ],
    },
    "F-reg-1": {
        "finding_id": "F-reg-1",
        "status": "ok",
        "text": "The registered Trust renewal certificate expired on 31-12-2023. AICTE Approval Process Handbook mandates active, unexpired trust / society registration.",
        "citations": [
            {
                "clause_ref": "APH-2026-I.1",
                "snippet": "Clause I.1: Institutional sponsoring trusts must maintain active registration with the relevant Charity Commissioner.",
            }
        ],
    },
    "F-plan-1": {
        "finding_id": "F-plan-1",
        "status": "ok",
        "text": "Optical Character Recognition (OCR) confidence score on the Municipal Town Planning approval seal was 58%, below the 70% threshold required for automated extraction.",
        "citations": [
            {
                "clause_ref": "APH-2026-V.2",
                "snippet": "Clause V.2: Municipal building sanction drawings must feature clearly legible town planning seals and authorized signatures.",
            }
        ],
    },
}

# ---------------------------------------------------------------------------
# 11. Metrics (Sample numbers clearly marked is_sample: true)
# ---------------------------------------------------------------------------
METRICS = {
    "detection_by_type": [
        {"type": "TEXT_EDITED_AFTER_CREATION", "n": 15, "detected": 14},
        {"type": "MODIFIED_AFTER_SIGNING", "n": 10, "detected": 10},
        {"type": "FONT_INCONSISTENCY", "n": 12, "detected": 11},
        {"type": "PRODUCER_MISMATCH", "n": 8, "detected": 8},
        {"type": "CROSSDOC_FIELD_MISMATCH", "n": 16, "detected": 16},
        {"type": "DOC_EXPIRED", "n": 14, "detected": 14},
        {"type": "ISSUER_MISMATCH", "n": 9, "detected": 9},
        {"type": "LOW_OCR_CONFIDENCE", "n": 6, "detected": 5},
    ],
    "clean_docs": 32,
    "false_positives": 1,
    "avg_seconds_per_doc": 1.48,
    "n_docs": 90,
    "generated_at": "2026-10-22T20:00:00Z",
    "is_sample": True,
}

# ---------------------------------------------------------------------------
# 12. Dashboard Response
# ---------------------------------------------------------------------------
DASHBOARD = {
    "kpis": {
        "applications": len(ALL_APPLICATION_SUMMARIES),
        "flagged": sum(1 for a in ALL_APPLICATION_SUMMARIES if a["risk_score"] > 0),
        "pending_verification": 2,
        "expiring": 1,
    },
    "queue": ALL_APPLICATION_SUMMARIES,
    "alerts": ALERTS_A,
}


def main():
    print("Writing mock JSON files to src/mock/...")
    with open(SRC_MOCK / "categories.json", "w") as f:
        json.dump(CATEGORIES, f, indent=2)

    with open(SRC_MOCK / "applications.json", "w") as f:
        json.dump(ALL_APPLICATION_SUMMARIES, f, indent=2)

    with open(SRC_MOCK / "application_details.json", "w") as f:
        json.dump(ALL_APPLICATION_DETAILS, f, indent=2)

    with open(SRC_MOCK / "rules.json", "w") as f:
        json.dump(RULES, f, indent=2)

    with open(SRC_MOCK / "audit.json", "w") as f:
        json.dump(AUDIT_EVENTS, f, indent=2)

    with open(SRC_MOCK / "audit_verify.json", "w") as f:
        json.dump(AUDIT_VERIFY, f, indent=2)

    with open(SRC_MOCK / "metrics.json", "w") as f:
        json.dump(METRICS, f, indent=2)

    with open(SRC_MOCK / "dashboard.json", "w") as f:
        json.dump(DASHBOARD, f, indent=2)

    with open(SRC_MOCK / "explanations.json", "w") as f:
        json.dump(EXPLANATIONS, f, indent=2)

    print("All mock JSON files generated successfully!")


if __name__ == "__main__":
    main()
