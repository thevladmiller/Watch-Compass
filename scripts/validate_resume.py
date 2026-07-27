#!/usr/bin/env python3
from pathlib import Path
from pypdf import PdfReader

root = Path(__file__).resolve().parents[1]
pdf = root / "output/pdf/Vlad_Miller_Resume.pdf"
reader = PdfReader(str(pdf))
assert len(reader.pages) == 1, f"Expected one page, got {len(reader.pages)}"
page = reader.pages[0]
w, h = float(page.mediabox.width), float(page.mediabox.height)
assert abs(w - 595.276) < 1 and abs(h - 841.89) < 1, (w, h)
text = page.extract_text()
required = ["Terraform", "GitHub", "Spacelift", "CI/CD", "APIs", "SaaS",
            "HiBob", "Okta", "Google Workspace", "Google Groups",
            "Microsoft Intune", "Intune", "GCPW", "SSO", "IAM", "RBAC",
            "Slack", "TopDesk", "Apple Business Manager", "Kandji",
            "Kandji Blueprints", "macOS", "Windows", "Zero-touch deployment",
            "Python", "Bash", "Google Apps Script", "AppSheet", "Ubiquiti",
            "Wi-Fi 7", "VLANs", "IoT segmentation", "Access control",
            "Structured cabling"]
missing = [term for term in required if term.lower() not in text.lower()]
assert not missing, f"Missing selectable keywords: {missing}"
projects = ["Enterprise Identity Platform", "AI Service Desk",
            "Modern Workplace Platform", "Network Modernisation"]
positions = [text.find(name) for name in projects]
assert all(pos >= 0 for pos in positions), positions
assert positions == sorted(positions), f"Incorrect project reading order: {positions}"
assert text.find("PROFILE") < text.find("SELECTED PROJECTS") < text.find("PROFESSIONAL EXPERIENCE") < text.find("EDUCATION")
assert "CORE EXPERTISE" not in text
assert "Voorschoten, Netherlands" in text
assert "120+ employee" in text
assert "approximately 156 employees" in text
assert "+31 6 25146840" in text
assert "vladmoraru91@gmail.com" in text
assert "linkedin.com/in/vlad-miller" in text
assert len(page.get("/Annots", [])) >= 3
result = (
    f"PASS: 1 A4 page ({w:.3f} x {h:.3f} pt)\n"
    f"PASS: {len(text)} extracted characters in logical section order\n"
    f"PASS: all {len(required)} required selectable ATS terms present\n"
    "PASS: selected projects extract in required order\n"
    "PASS: Core Expertise removed\n"
    "PASS: Voorschoten retained as citizenM location\n"
    "PASS: citizenM scale stated as 120+ employees\n"
    "PASS: Studocu scale stated as approximately 156 employees\n"
    "PASS: contact details unchanged and 3 hyperlinks present\n"
)
(root / "output/pdf/Vlad_Miller_Resume_Extracted_Text.txt").write_text(text, encoding="utf-8")
(root / "output/pdf/Vlad_Miller_Resume_validation.txt").write_text(result, encoding="utf-8")
print(result, end="")
