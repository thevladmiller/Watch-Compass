#!/usr/bin/env python3
import json
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, Table, TableStyle,
    KeepTogether, ListFlowable, ListItem
)

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / "data/resume.json").read_text())
OUT = ROOT / "output/pdf/Vlad_Miller_Resume.pdf"
OUT.parent.mkdir(parents=True, exist_ok=True)

font_regular = Path("/System/Library/Fonts/Supplemental/Arial.ttf")
font_bold = Path("/System/Library/Fonts/Supplemental/Arial Bold.ttf")
if font_regular.exists() and font_bold.exists():
    pdfmetrics.registerFont(TTFont("Resume", str(font_regular)))
    pdfmetrics.registerFont(TTFont("ResumeBold", str(font_bold)))
else:
    pdfmetrics.registerFont(TTFont("Resume", "/System/Library/Fonts/Supplemental/Verdana.ttf"))
    pdfmetrics.registerFont(TTFont("ResumeBold", "/System/Library/Fonts/Supplemental/Verdana Bold.ttf"))

BLUE = colors.HexColor("#0969C3")
INK = colors.HexColor("#16181D")
MUTED = colors.HexColor("#5D6470")
RULE = colors.HexColor("#D9DEE5")
TINT = colors.HexColor("#F4F7FA")

def style(name, size, leading=None, font="Resume", color=INK, **kw):
    return ParagraphStyle(name, fontName=font, fontSize=size, leading=leading or size * 1.22,
                          textColor=color, alignment=TA_LEFT, splitLongWords=False, **kw)

S = {
    "name": style("name", 27, 29, "ResumeBold", spaceAfter=1.5*mm),
    "title": style("title", 14, 16, "ResumeBold", BLUE),
    "subtitle": style("subtitle", 8.4, 10.2, "Resume", MUTED, spaceAfter=2.2*mm),
    "contact": style("contact", 8.2, 10.2, "Resume", INK),
    "status": style("status", 8.2, 10.2, "ResumeBold", BLUE, spaceAfter=3.2*mm),
    "section": style("section", 8.8, 10.5, "ResumeBold", BLUE, spaceBefore=2.0*mm, spaceAfter=1.2*mm,
                     textTransform="uppercase", tracking=0.7),
    "coresection": style("coresection", 9.1, 11, "ResumeBold", colors.white,
                         textTransform="uppercase", tracking=0.8),
    "body": style("body", 9.5, 11.5),
    "small": style("small", 9.0, 10.5),
    "skilllabel": style("skilllabel", 8.0, 9.7, "ResumeBold", BLUE),
    "skill": style("skill", 8.0, 9.7),
    "projecttitle": style("projecttitle", 8.5, 10, "ResumeBold", BLUE),
    "projecttech": style("projecttech", 7.3, 8.6, "ResumeBold", MUTED),
    "projectbody": style("projectbody", 8.15, 9.5),
    "tools": style("tools", 7.8, 9.3, "ResumeBold", MUTED),
    "role": style("role", 9.3, 11, "ResumeBold"),
    "meta": style("meta", 7.9, 9.5, "Resume", MUTED),
    "bullet": style("bullet", 9.1, 10.2, leftIndent=0, firstLineIndent=0),
    "footerlabel": style("footerlabel", 7.4, 8.6, "ResumeBold", BLUE, tracking=0.2),
    "footertext": style("footertext", 7.7, 8.9),
}

def heading(text):
    return Table([[Paragraph(text.upper(), S["section"])]], colWidths=[174*mm],
                 style=TableStyle([("LINEBELOW", (0,0), (-1,-1), .45, RULE),
                                   ("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),0),
                                   ("TOPPADDING",(0,0),(-1,-1),0),("BOTTOMPADDING",(0,0),(-1,-1),1.2*mm)]))

def core_heading():
    return Table([[Paragraph("CORE EXPERTISE", S["coresection"])]], colWidths=[174*mm],
                 style=TableStyle([
                     ("BACKGROUND", (0,0), (-1,-1), BLUE),
                     ("LEFTPADDING", (0,0), (-1,-1), 3*mm),
                     ("RIGHTPADDING", (0,0), (-1,-1), 3*mm),
                     ("TOPPADDING", (0,0), (-1,-1), 1.8*mm),
                     ("BOTTOMPADDING", (0,0), (-1,-1), 1.8*mm)
                 ]))

def bullets(items):
    return ListFlowable(
        [ListItem(Paragraph(x, S["bullet"]), leftIndent=3.4*mm) for x in items],
        bulletType="bullet", start="circle", bulletFontName="Resume", bulletFontSize=4.4,
        leftIndent=3.3*mm, bulletOffsetY=1.3, spaceAfter=.7*mm
    )

doc = BaseDocTemplate(str(OUT), pagesize=A4, leftMargin=17*mm, rightMargin=19*mm,
                      topMargin=14*mm, bottomMargin=14*mm,
                      title="Vlad Miller - Infrastructure & Automation Engineer",
                      author="Vlad Miller", subject="Resume")
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, leftPadding=0, rightPadding=0,
              topPadding=0, bottomPadding=0)
doc.addPageTemplates(PageTemplate(id="resume", frames=[frame]))

story = [
    Paragraph(DATA["name"].upper(), S["name"]),
    Paragraph(DATA["title"], S["title"]),
    Paragraph(DATA["subtitle"], S["subtitle"]),
    Paragraph(DATA["contact"], S["contact"]),
    Paragraph(DATA["status"], S["status"]),
    heading("Profile"), Spacer(1, .8*mm),
    Paragraph(DATA["profile"], S["body"]), Spacer(1, 1.4*mm),
    heading("Selected Projects"), Spacer(1, .8*mm)
]

project_cells = []
for p in DATA["projects"]:
    project_cells.append([
        Paragraph(p["title"], S["projecttitle"]),
        Spacer(1, .35*mm),
        Paragraph(p["technology"], S["projecttech"]),
        Spacer(1, .45*mm),
        Paragraph(p["text"], S["projectbody"])
    ])
projects = Table([project_cells[:2], project_cells[2:]], colWidths=[87*mm, 87*mm], hAlign="LEFT")
projects.setStyle(TableStyle([
    ("BACKGROUND",(0,0),(-1,-1),TINT),
    ("BOX",(0,0),(-1,-1),.35,RULE),
    ("INNERGRID",(0,0),(-1,-1),.35,RULE),
    ("VALIGN",(0,0),(-1,-1),"TOP"),
    ("LEFTPADDING",(0,0),(-1,-1),3*mm),
    ("RIGHTPADDING",(0,0),(-1,-1),3*mm),
    ("TOPPADDING",(0,0),(-1,-1),2.0*mm),
    ("BOTTOMPADDING",(0,0),(-1,-1),2.0*mm)
]))
story += [projects, Spacer(1, .55*mm), Paragraph(DATA["additional_tools"], S["tools"]),
          Spacer(1, .6*mm), heading("Professional Experience"), Spacer(1, .7*mm)]

for job in DATA["experience"]:
    roleline = Table([[Paragraph(f'{job["role"]} · {job["company"]}', S["role"]),
                       Paragraph(f'{job["dates"]}<br/>{job["location"]}', S["meta"])]],
                     colWidths=[125*mm,49*mm])
    roleline.setStyle(TableStyle([
        ("VALIGN",(0,0),(-1,-1),"TOP"), ("ALIGN",(1,0),(1,0),"RIGHT"),
        ("LEFTPADDING",(0,0),(-1,-1),0), ("RIGHTPADDING",(0,0),(-1,-1),0),
        ("TOPPADDING",(0,0),(-1,-1),.4*mm), ("BOTTOMPADDING",(0,0),(-1,-1),.45*mm)
    ]))
    content = [roleline]
    if "bullets" in job:
        if "summary" in job:
            content.append(Paragraph(job["summary"], S["meta"]))
            content.append(Spacer(1, .35*mm))
        content.append(bullets(job["bullets"]))
    else:
        content.append(Paragraph(job["summary"], S["small"]))
        content.append(Spacer(1, .7*mm))
    story.append(KeepTogether(content))

footer = Table([
    [Paragraph("CERTIFICATIONS", S["footerlabel"]),
     Paragraph(DATA["certifications"], S["footertext"])],
    [Paragraph("PROFESSIONAL DEVELOPMENT", S["footerlabel"]),
     Paragraph(DATA["professional_development"], S["footertext"])]
], colWidths=[36*mm, 138*mm])
footer.setStyle(TableStyle([
    ("VALIGN",(0,0),(-1,-1),"TOP"),
    ("LINEABOVE",(0,0),(-1,0),.35,RULE),
    ("LINEBELOW",(0,0),(-1,0),.25,RULE),
    ("LEFTPADDING",(0,0),(-1,-1),0),
    ("RIGHTPADDING",(0,0),(-1,-1),1*mm),
    ("TOPPADDING",(0,0),(-1,-1),.4*mm),
    ("BOTTOMPADDING",(0,0),(-1,-1),.4*mm)
]))
story += [heading("Education"), Spacer(1, .7*mm),
          Paragraph(DATA["education"], S["role"]),
          Paragraph(DATA["additional_education"], S["meta"]),
          Spacer(1, .45*mm), footer]

doc.build(story)
print(OUT)
