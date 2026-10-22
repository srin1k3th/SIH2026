"""
frontend/scripts/make_mock_assets.py
Generates realistic mock PDF documents, rasterized 2x page PNG renderings,
and computes exact bounding boxes using PyMuPDF for visual overlay alignment.
"""

import os
from pathlib import Path
import json
import fitz  # PyMuPDF
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
import qrcode
from PIL import Image, ImageFilter, ImageDraw

SCRIPTS_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = SCRIPTS_DIR.parent
PUBLIC_MOCK = FRONTEND_DIR / "public" / "mock"
PDF_DIR = PUBLIC_MOCK / "pdfs"
RENDER_DIR = PUBLIC_MOCK / "render"

PDF_DIR.mkdir(parents=True, exist_ok=True)
RENDER_DIR.mkdir(parents=True, exist_ok=True)

A4_WIDTH, A4_HEIGHT = A4  # 595.27555, 841.88976


def generate_qr(data: str, out_path: Path):
    qr = qrcode.QRCode(box_size=4, border=1)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    img.save(str(out_path))


def make_d_lease_rev1(pdf_path: Path):
    c = canvas.Canvas(str(pdf_path), pagesize=A4)
    c.setCreator("ReportLab PDF Library")
    c.setTitle("Land Lease Deed - Government Registered")

    # Page 1
    c.setFont("Helvetica-Bold", 16)
    c.drawString(72, 780, "GOVERNMENT OF MAHARASHTRA")
    c.setFont("Helvetica-Bold", 12)
    c.drawString(72, 760, "SUB-REGISTRAR OFFICE, PUNE (HAVELI)")
    c.setFont("Helvetica", 10)
    c.drawString(72, 742, "Registration Serial No: 4892/2015 | Date: 01-06-2015")
    c.setStrokeColorRGB(0.7, 0.7, 0.7)
    c.setLineWidth(1)
    c.line(72, 730, 523, 730)

    c.setFont("Helvetica-Bold", 13)
    c.drawString(72, 700, "PERPETUAL LAND LEASE DEED (30 YEARS)")

    text_p1 = [
        "This Deed of Lease is executed on this 1st day of June, 2015 between the District Collector,",
        "Pune acting on behalf of the Governor of Maharashtra (hereinafter referred to as the LESSOR),",
        "AND",
        "Shri Ram Educational Trust, a public educational trust registered under Bombay Public Trusts Act,",
        "represented by its Managing Trustee Fr. Paul Fernandes (hereinafter referred to as the LESSEE).",
        "",
        "WHEREAS the Lessee has applied for establishment of an educational campus offering technical",
        "and higher professional degree courses in engineering and allied fields;",
        "",
        "PROPERTY SCHEDULE - PARCEL A:",
        "All that piece and parcel of non-agricultural land situated at Revenue Village Wagholi, Haveli Taluka,",
        "bearing Survey No. SY 214/3B, bounded on North by Public Road 60ft, on South by ZP Boundary,",
        "on East by Survey No 214/4, and on West by Nala Canal.",
        "",
        "TERMS AND CONDITIONS:",
        "1. The lease term shall be for thirty (30) consecutive years commencing from 01-06-2015 to 31-05-2045.",
        "2. The demised premises shall be utilized exclusively for academic, research, laboratory, and campus amenities.",
    ]
    y = 660
    c.setFont("Helvetica", 10)
    for line in text_p1:
        if line.startswith("PROPERTY SCHEDULE") or line.startswith("TERMS AND CONDITIONS"):
            c.setFont("Helvetica-Bold", 10)
        else:
            c.setFont("Helvetica", 10)
        c.drawString(72, y, line)
        y -= 18

    c.setFont("Helvetica-Oblique", 9)
    c.drawString(72, 80, "[Continued on Page 2] -- Sub-Registrar Seal Affixed")
    c.showPage()

    # Page 2
    c.setFont("Helvetica-Bold", 12)
    c.drawString(72, 780, "PERPETUAL LAND LEASE DEED - SCHEDULE CONTINUED")
    c.setStrokeColorRGB(0.7, 0.7, 0.7)
    c.line(72, 770, 523, 770)

    text_p2 = [
        "3. COVENANTS AS TO DEMISED LAND AREA AND BOUNDARIES:",
        "The Lessor covenants and agrees that the total contiguous land area demised under this lease deed",
        "shall strictly measure exactly 4.2 acres (16,997 sq m) in accordance with the certified demarcation",
        "map approved by the Deputy Superintendent of Land Records, Pune vide Order No. LND-2015-88.",
        "",
        "4. REGULATORY NORMS AND STATUTORY COMPLIANCE:",
        "The Lessee covenants to abide by all spatial and infrastructural norms stipulated by statutory",
        "regulatory bodies including the All India Council for Technical Education (AICTE), New Delhi.",
        "",
        "IN WITNESS WHEREOF the parties have set their respective hands and seals on this deed.",
        "",
        "Signatories:",
        "Lessor: District Collector, Pune District Administration",
        "Lessee: Shri Ram Educational Trust (Authorized Trustee Fr. Paul Fernandes)",
        "Witness 1: Ar. Rajesh V. Deshmukh (CA/2008/42119)",
        "Witness 2: Shri K. R. Sharma, Advocate & Notary",
    ]
    y = 730
    for line in text_p2:
        if line.startswith("3.") or line.startswith("4.") or line.startswith("Signatories:"):
            c.setFont("Helvetica-Bold", 10)
        else:
            c.setFont("Helvetica", 10)
        c.drawString(72, y, line)
        y -= 22

    c.setFont("Helvetica-Oblique", 9)
    c.drawString(72, 80, "End of Lease Document - Registered Volume 412, Pages 1-2")
    c.showPage()
    c.save()


def make_d_lease_rev2(rev1_path: Path, rev2_path: Path):
    """
    Creates Rev 2 with planted tampering:
    Overwrites '4.2 acres' with '9.2 acres' in Courier-Bold font on Page 2,
    modifying producer metadata to Microsoft Word.
    """
    doc = fitz.open(str(rev1_path))
    page2 = doc[1]

    # Search for "4.2 acres" on page 2
    rects = page2.search_for("4.2 acres")
    if not rects:
        raise RuntimeError("Text '4.2 acres' not found on page 2 of lease deed")

    target_rect = rects[0]
    # Draw white rectangle to redact original "4.2 acres"
    page2.draw_rect(target_rect, color=(1, 1, 1), fill=(1, 1, 1))

    # Insert "9.2 acres" in Courier-Bold font (visibly different font and width)
    # Origin for insert_text is baseline: target_rect.x0, target_rect.y1 - 1
    page2.insert_text(
        fitz.Point(target_rect.x0, target_rect.y1 - 1.5),
        "9.2 acres",
        fontsize=10,
        fontname="cour",  # Courier standard 14 font
        color=(0, 0, 0),
    )

    # Set metadata to simulate document editing in another tool
    meta = doc.metadata
    meta["producer"] = "Microsoft Word for Office 365"
    meta["modDate"] = "D:20261020143000Z"
    doc.set_metadata(meta)

    doc.save(str(rev2_path))
    doc.close()


def make_d_noc(pdf_path: Path):
    c = canvas.Canvas(str(pdf_path), pagesize=A4)
    c.setCreator("DigitalSigner Demo CA")
    c.setTitle("State Authority No Objection Certificate")

    c.setFont("Helvetica-Bold", 15)
    c.drawString(72, 780, "HIGHER & TECHNICAL EDUCATION DEPARTMENT")
    c.setFont("Helvetica-Bold", 12)
    c.drawString(72, 762, "GOVERNMENT OF MAHARASHTRA, MANTRALAYA, MUMBAI")
    c.setFont("Helvetica", 9)
    c.drawString(72, 745, "No. TEM-2022/PK-114/TASHI-4 | Date of Issue: 18-05-2022")
    c.setStrokeColorRGB(0.7, 0.7, 0.7)
    c.line(72, 735, 523, 735)

    c.setFont("Helvetica-Bold", 13)
    c.drawString(72, 705, "NO OBJECTION CERTIFICATE (NOC)")

    lines = [
        "To,",
        "The Member Secretary,",
        "All India Council for Technical Education (AICTE),",
        "Nelson Mandela Marg, Vasant Kunj, New Delhi - 110070.",
        "",
        "Sir,",
        "Sub: State Government NOC for Extension of Approval (EoA) to Technical Campus.",
        "",
        "The Government of Maharashtra has examined the proposal submitted by Shri Ram Educational Trust",
        "for its technical campus situated on Survey No. SY-214/3B possessing contiguous land area of 4.2 acres.",
        "",
        "The State Government hereby issues its No Objection Certificate subject to the condition that the",
        "institution shall strictly adhere to all government reservation policies and fee structures approved",
        "by the State Fee Regulating Authority.",
        "",
        "ALTERATION NOTICE: Content modified after cryptographic certificate sealing without re-attestation.",
        "",
        "Signatory Authority:",
        "Under Secretary, Higher & Technical Education Department",
        "Government of Maharashtra (Digitally Signed with Class 3 Digital Certificate)",
    ]

    y = 665
    for line in lines:
        if line.startswith("ALTERATION NOTICE"):
            c.setFont("Helvetica-Bold", 10)
            c.setFillColorRGB(0.15, 0.15, 0.15)
        elif line.startswith("NO OBJECTION") or line.startswith("Sub:") or line.startswith("Signatory"):
            c.setFont("Helvetica-Bold", 10)
            c.setFillColorRGB(0, 0, 0)
        else:
            c.setFont("Helvetica", 10)
            c.setFillColorRGB(0, 0, 0)
        c.drawString(72, y, line)
        y -= 22

    # Draw digital signature stamp representation
    c.setStrokeColorRGB(0.2, 0.4, 0.8)
    c.setLineWidth(1.5)
    c.rect(300, 140, 220, 80)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(310, 205, "DIGITALLY SIGNED CERTIFICATE")
    c.setFont("Helvetica", 8)
    c.drawString(310, 190, "Signer: Under Secretary, Revenue Dept.")
    c.drawString(310, 175, "Certificate Authority: MahaGov Sub-CA-1")
    c.drawString(310, 160, "Timestamp: 2022-05-18T11:42:10+05:30")
    c.drawString(310, 145, "Status: Cryptographic Signature Intact")

    c.showPage()
    c.save()


def make_d_fire(pdf_path: Path):
    c = canvas.Canvas(str(pdf_path), pagesize=A4)
    c.setCreator("State Fire Services Portal")
    c.setTitle("Fire & Life Safety Clearance Certificate")

    c.setFont("Helvetica-Bold", 16)
    c.drawString(72, 780, "PUNE MUNICIPAL CORPORATION")
    c.setFont("Helvetica-Bold", 12)
    c.drawString(72, 760, "CHIEF FIRE OFFICER - FIRE BRIGADE HEADQUARTERS")
    c.setFont("Helvetica", 9)
    c.drawString(72, 744, "Ref No: PMC/FIRE/NOC/2025/88213 | Date of Issuance: 01-04-2025")
    c.setStrokeColorRGB(0.7, 0.7, 0.7)
    c.line(72, 735, 523, 735)

    c.setFont("Helvetica-Bold", 13)
    c.drawString(72, 700, "FIRE & LIFE SAFETY CERTIFICATE (FINAL NOC)")

    lines = [
        "This is to certify that the institutional building premises owned by Shri Ram Educational Trust,",
        "situated at Survey No. SY 214/3B, Wagholi, Pune has been inspected by the Divisional Fire Officer.",
        "",
        "The building is provided with adequate fire prevention, life safety and fire protection measures",
        "in compliance with Part IV of the National Building Code of India (NBC 2016).",
        "",
        "Validity Details:",
        "Certificate Valid From: 01-04-2025",
        "Certificate Valid To: 31-03-2028",
        "",
        "This certificate remains valid subject to regular annual maintenance of all wet risers, sprinklers,",
        "smoke evacuation systems, and periodic conduct of campus evacuation drills.",
    ]

    y = 660
    for line in lines:
        if line.startswith("Validity Details") or line.startswith("Certificate Valid"):
            c.setFont("Helvetica-Bold", 10)
        else:
            c.setFont("Helvetica", 10)
        c.drawString(72, y, line)
        y -= 22

    # QR Code
    qr_tmp = SCRIPTS_DIR / "temp_fire_qr.png"
    generate_qr("FSC/2025/88213", qr_tmp)
    c.drawImage(str(qr_tmp), 410, 160, width=90, height=90)
    c.setFont("Helvetica", 8)
    c.drawString(395, 145, "Scan QR to verify: FSC/2025/88213")
    if qr_tmp.exists():
        qr_tmp.unlink()

    c.drawString(72, 180, "Chief Fire Officer, Municipal Corporation")
    c.showPage()
    c.save()


def make_d_accr(pdf_path: Path):
    c = canvas.Canvas(str(pdf_path), pagesize=A4)
    c.setCreator("National Accreditation Portal")
    c.setTitle("National Accreditation Board Certificate")

    c.setFont("Helvetica-Bold", 16)
    c.drawString(72, 780, "NATIONAL ACCREDITATION BOARD (NAB)")
    c.setFont("Helvetica", 10)
    c.drawString(72, 762, "Quality Assurance in Higher Technical Education | New Delhi")
    c.setStrokeColorRGB(0.7, 0.7, 0.7)
    c.line(72, 750, 523, 750)

    c.setFont("Helvetica-Bold", 13)
    c.drawString(72, 715, "CERTIFICATE OF ACCREDITATION")

    lines = [
        "This is to certify that the undergraduate engineering programmes offered by the institution under",
        "Shri Ram Educational Trust on Survey No. SY 214/3B have been duly evaluated by the visiting",
        "Expert Team of the National Accreditation Board.",
        "",
        "The programmes have met the prescribed qualitative criteria and benchmarks for accreditation.",
        "",
        "Validity Period:",
        "Accreditation Valid From: 01-04-2022",
        "Accreditation Valid Through: 31-03-2027",
        "",
        "Note: The accreditation status is subject to annual compliance review and adherence to faculty-student norms.",
    ]

    y = 670
    for line in lines:
        if line.startswith("Validity Period") or line.startswith("Accreditation Valid"):
            c.setFont("Helvetica-Bold", 10)
        else:
            c.setFont("Helvetica", 10)
        c.drawString(72, y, line)
        y -= 22

    # QR Code
    qr_tmp = SCRIPTS_DIR / "temp_accr_qr.png"
    generate_qr("NBA/2022/94101", qr_tmp)
    c.drawImage(str(qr_tmp), 410, 160, width=90, height=90)
    c.setFont("Helvetica", 8)
    c.drawString(395, 145, "Issuer Reference: NBA/2022/94101")
    if qr_tmp.exists():
        qr_tmp.unlink()

    c.drawString(72, 180, "Member Secretary, Accreditation Board")
    c.showPage()
    c.save()


def make_d_reg(pdf_path: Path):
    c = canvas.Canvas(str(pdf_path), pagesize=A4)
    c.setCreator("Charity Commissioner Office")
    c.setTitle("Public Trust Registration Certificate")

    c.setFont("Helvetica-Bold", 16)
    c.drawString(72, 780, "OFFICE OF THE CHARITY COMMISSIONER")
    c.setFont("Helvetica-Bold", 12)
    c.drawString(72, 762, "PUNE DIVISION, MAHARASHTRA STATE")
    c.setStrokeColorRGB(0.7, 0.7, 0.7)
    c.line(72, 750, 523, 750)

    c.setFont("Helvetica-Bold", 13)
    c.drawString(72, 710, "CERTIFICATE OF TRUST REGISTRATION")

    lines = [
        "Certificate No: F-18492/Pune | Registration Date: 12-01-2004",
        "",
        "This is to certify that Shri Ram Educational Trust has been registered under the provisions of the",
        "Maharashtra Public Trusts Act, 1950 (XXIX of 1950) in the Public Trusts Registration Office, Pune.",
        "",
        "Address: Wagholi Campus, Survey No. SY 214/3B, Pune 412207",
        "Land holding: 4.2 acres",
        "",
        "Statutory Society Renewal Clause:",
        "The mandatory five-year regulatory renewal of this society registration was: Valid until: 31-12-2023",
        "",
        "CAUTION: Renewal application must be filed with the Charity Commissioner prior to expiry date.",
    ]

    y = 660
    for line in lines:
        if line.startswith("Statutory Society Renewal") or "Valid until: 31-12-2023" in line:
            c.setFont("Helvetica-Bold", 10)
        else:
            c.setFont("Helvetica", 10)
        c.drawString(72, y, line)
        y -= 22

    c.drawString(72, 200, "Assistant Charity Commissioner, Pune Division")
    c.showPage()
    c.save()


def make_d_plan(pdf_path: Path):
    """
    Creates a simulated scanned document with slight rotation, noise, and town planning stamp.
    """
    # Create base canvas to temporary image
    img = Image.new("RGB", (int(A4_WIDTH * 2), int(A4_HEIGHT * 2)), (252, 252, 250))
    draw = ImageDraw.Draw(img)

    # Simulated scanned text lines
    draw.text((120, 140), "TOWN PLANNING DEPARTMENT - MUNICIPAL AUTHORITY", fill=(30, 30, 30))
    draw.text((120, 180), "BUILDING PLAN SANCTION & OCCUPANCY APPROVAL", fill=(20, 20, 20))
    draw.line([(120, 210), (1050, 210)], fill=(120, 120, 120), width=3)

    plan_lines = [
        "File Reference: TP/SANCTION/2021/4192",
        "Applicant: Shri Ram Educational Trust",
        "Location: Survey No. SY 214/3B, Wagholi, Taluka Haveli",
        "Category: Institutional - Educational Technical Campus (Engineering Block A & B)",
        "",
        "The structural building plans, floor layout drawings, and architectural specifications",
        "submitted by Ar. Rajesh V. Deshmukh have been scrutinized under Section 45 of MRTP Act.",
        "Sanction is hereby granted subject to verification of municipal tax clearance certificates.",
    ]
    y = 260
    for line in plan_lines:
        draw.text((120, y), line, fill=(40, 40, 40))
        y += 45

    # Simulated municipal stamp box
    stamp_x0, stamp_y0, stamp_x1, stamp_y1 = 680, 1100, 1020, 1340
    draw.rectangle([stamp_x0, stamp_y0, stamp_x1, stamp_y1], outline=(150, 50, 50), width=4)
    draw.text((stamp_x0 + 20, stamp_y0 + 25), "TOWN PLANNING SANCTION", fill=(150, 50, 50))
    draw.text((stamp_x0 + 20, stamp_y0 + 70), "STAMP: MUNICIPAL CORP", fill=(150, 50, 50))
    draw.text((stamp_x0 + 20, stamp_y0 + 115), "SANCTIONED: 14-08-2021", fill=(150, 50, 50))
    draw.text((stamp_x0 + 20, stamp_y0 + 160), "LOW OCR FIDELITY REGION", fill=(180, 50, 50))

    # Add slight rotation and noise for realistic scan
    img = img.rotate(0.6, resample=Image.BICUBIC, fillcolor=(255, 255, 255))

    # Save to PDF
    img.save(str(pdf_path), "PDF", resolution=144.0)


def make_clean_doc(pdf_path: Path, title: str, subtitle: str, body_lines: list[str]):
    c = canvas.Canvas(str(pdf_path), pagesize=A4)
    c.setTitle(title)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(72, 780, title)
    c.setFont("Helvetica", 11)
    c.drawString(72, 760, subtitle)
    c.setStrokeColorRGB(0.7, 0.7, 0.7)
    c.line(72, 745, 523, 745)

    y = 700
    for line in body_lines:
        c.drawString(72, y, line)
        y -= 24

    c.setFont("Helvetica-Oblique", 9)
    c.drawString(72, 80, "Digitally Verified & Registered Clean Record - Government of Maharashtra")
    c.showPage()
    c.save()


def render_all_pdfs_to_png():
    """
    Renders all PDF pages at 2x resolution (144 dpi) into public/mock/render/{doc_id}/{rev}/page{n}.png.
    """
    renders = [
        ("d_lease", 1, PDF_DIR / "d_lease_rev1.pdf"),
        ("d_lease", 2, PDF_DIR / "d_lease.pdf"),
        ("d_noc", 1, PDF_DIR / "d_noc.pdf"),
        ("d_fire", 1, PDF_DIR / "d_fire.pdf"),
        ("d_accr", 1, PDF_DIR / "d_accr.pdf"),
        ("d_reg", 1, PDF_DIR / "d_reg.pdf"),
        ("d_plan", 1, PDF_DIR / "d_plan.pdf"),
        ("d_clean_land", 1, PDF_DIR / "d_clean_land.pdf"),
        ("d_clean_bldg", 1, PDF_DIR / "d_clean_bldg.pdf"),
        ("d_clean_fire", 1, PDF_DIR / "d_clean_fire.pdf"),
        ("d_clean_aicte", 1, PDF_DIR / "d_clean_aicte.pdf"),
    ]

    for doc_id, rev, pdf_path in renders:
        out_folder = RENDER_DIR / doc_id / str(rev)
        out_folder.mkdir(parents=True, exist_ok=True)
        doc = fitz.open(str(pdf_path))
        for page_idx in range(len(doc)):
            page = doc[page_idx]
            pix = page.get_pixmap(dpi=144)
            page_png = out_folder / f"page{page_idx + 1}.png"
            pix.save(str(page_png))
        doc.close()


def compute_exact_bboxes():
    """
    Computes exact bounding boxes from the generated PDFs using PyMuPDF page.search_for,
    expanded by 2 points per prompt requirement.
    """
    computed = {}

    # d_lease Rev 2: page 2 search for "9.2 acres"
    doc_lease = fitz.open(str(PDF_DIR / "d_lease.pdf"))
    p2 = doc_lease[1]
    res_lease = p2.search_for("9.2 acres")
    if res_lease:
        r = res_lease[0]
        # [x0, y0, x1, y1] expanded by 2pt
        computed["F-lease-1"] = [round(r.x0 - 2, 2), round(r.y0 - 2, 2), round(r.x1 + 2, 2), round(r.y1 + 2, 2)]
        # F-lease-2 overlapping slightly larger
        computed["F-lease-2"] = [round(r.x0 - 4, 2), round(r.y0 - 4, 2), round(r.x1 + 4, 2), round(r.y1 + 4, 2)]
        # F-lease-4 overlapping
        computed["F-lease-4"] = [round(r.x0 - 1, 2), round(r.y0 - 1, 2), round(r.x1 + 1, 2), round(r.y1 + 1, 2)]
    else:
        computed["F-lease-1"] = [210.0, 78.0, 260.0, 94.0]
        computed["F-lease-2"] = [208.0, 76.0, 262.0, 96.0]
        computed["F-lease-4"] = [211.0, 79.0, 259.0, 93.0]
    doc_lease.close()

    # d_noc: search for "Content modified after cryptographic certificate sealing"
    doc_noc = fitz.open(str(PDF_DIR / "d_noc.pdf"))
    p1 = doc_noc[0]
    res_noc = p1.search_for("ALTERATION NOTICE")
    if res_noc:
        r = res_noc[0]
        computed["F-noc-1"] = [round(r.x0 - 2, 2), round(r.y0 - 2, 2), round(r.x1 + 200, 2), round(r.y1 + 2, 2)]
    else:
        computed["F-noc-1"] = [70.0, 480.0, 450.0, 500.0]
    doc_noc.close()

    # d_accr: search for "31-03-2027"
    doc_accr = fitz.open(str(PDF_DIR / "d_accr.pdf"))
    res_accr = doc_accr[0].search_for("31-03-2027")
    if res_accr:
        r = res_accr[0]
        computed["F-accr-1"] = [round(r.x0 - 2, 2), round(r.y0 - 2, 2), round(r.x1 + 2, 2), round(r.y1 + 2, 2)]
    else:
        computed["F-accr-1"] = [225.0, 248.0, 290.0, 262.0]
    doc_accr.close()

    # d_reg: search for "Valid until: 31-12-2023"
    doc_reg = fitz.open(str(PDF_DIR / "d_reg.pdf"))
    res_reg = doc_reg[0].search_for("Valid until: 31-12-2023")
    if res_reg:
        r = res_reg[0]
        computed["F-reg-1"] = [round(r.x0 - 2, 2), round(r.y0 - 2, 2), round(r.x1 + 2, 2), round(r.y1 + 2, 2)]
    else:
        computed["F-reg-1"] = [70.0, 260.0, 220.0, 275.0]
    doc_reg.close()

    # d_plan: stamp region (scaled to PDF coordinates 595.28 x 841.89)
    # The stamp in the image was placed at approx (x0=340pt, y0=550pt, x1=510pt, y1=670pt)
    computed["F-plan-1"] = [340.0, 550.0, 510.0, 670.0]

    with open(SCRIPTS_DIR / "computed_bboxes.json", "w") as f:
        json.dump(computed, f, indent=2)
    print("Exact bounding boxes computed and saved to computed_bboxes.json")


def main():
    print("Generating Application A mock PDFs...")
    # 1. d_lease
    rev1_path = PDF_DIR / "d_lease_rev1.pdf"
    rev2_path = PDF_DIR / "d_lease.pdf"
    make_d_lease_rev1(rev1_path)
    make_d_lease_rev2(rev1_path, rev2_path)

    # 2. d_noc
    make_d_noc(PDF_DIR / "d_noc.pdf")

    # 3. d_fire
    make_d_fire(PDF_DIR / "d_fire.pdf")

    # 4. d_accr
    make_d_accr(PDF_DIR / "d_accr.pdf")

    # 5. d_reg
    make_d_reg(PDF_DIR / "d_reg.pdf")

    # 6. d_plan
    make_d_plan(PDF_DIR / "d_plan.pdf")

    print("Generating Application B (clean) mock PDFs...")
    make_clean_doc(
        PDF_DIR / "d_clean_land.pdf",
        "GOVERNMENT LAND ALLOTMENT ORDER",
        "Technical Education Department | Nagpur Division",
        [
            "Allotment of 25,000 sq m institutional land at Khapri Campus to Clean Valley Polytechnic.",
            "Survey Numbers: 88/1, 88/2. Lease term: 50 years valid from 01-01-2010 to 31-12-2060.",
            "All property taxes and statutory land records verified intact.",
        ],
    )
    make_clean_doc(
        PDF_DIR / "d_clean_bldg.pdf",
        "PUBLIC WORKS DEPARTMENT - BUILDING OCCUPANCY CERTIFICATE",
        "Executive Engineer, PWD Building Division, Nagpur",
        [
            "Building completion inspection completed on 10-05-2018.",
            "All physical academic and administrative amenities comply with AICTE Approval Process Handbook.",
            "Certificate valid for continuous educational use through 2038.",
        ],
    )
    make_clean_doc(
        PDF_DIR / "d_clean_fire.pdf",
        "FIRE & EMERGENCY SERVICES CLEARANCE NOC",
        "Municipal Fire Service Headquarters",
        [
            "Fire prevention and emergency egress installations verified satisfactory.",
            "Certificate Reference: FIRE/NOC/2026/19420.",
            "Valid From: 15-01-2026 | Valid Through: 14-01-2029.",
        ],
    )
    make_clean_doc(
        PDF_DIR / "d_clean_aicte.pdf",
        "AICTE PRIOR EXTENSION OF APPROVAL (EOA)",
        "All India Council for Technical Education, New Delhi",
        [
            "Extension of Approval granted for Academic Year 2025-2026.",
            "Institution: Clean Valley Polytechnic (Diploma Engineering).",
            "Zero deficiencies recorded during committee review.",
        ],
    )

    print("Rendering 2x PNG images for all PDF pages...")
    render_all_pdfs_to_png()

    print("Computing exact bounding boxes...")
    compute_exact_bboxes()

    print("Mock assets successfully generated!")


if __name__ == "__main__":
    main()
