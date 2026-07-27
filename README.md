# Vlad Miller resume

Production-ready A4 resume with selectable text and an editable, data-driven source.

## Edit the content

Open `data/resume.json`. Contact details, title, dates, skills, achievement summaries, job descriptions, and education are all maintained there. The layout and typography live in `scripts/build_resume.py`.

The current source uses confirmed contact details from the supplied resume. Replace the values in `contact` if they change. Keep bullet text concise to preserve the one-page layout.

## Build

This project uses Python 3, ReportLab, and pypdf:

```sh
python3 -m pip install reportlab pypdf
python3 scripts/build_resume.py
python3 scripts/validate_resume.py
```

The finished file is written to `output/pdf/Vlad_Miller_Resume.pdf`.

## Fonts

The build uses the system Arial font on macOS and embeds a subset in the PDF. If Arial is unavailable, it falls back to system Verdana. No font file is included or redistributed with this project.

## Preview and print QA

Render the PDF with Poppler:

```sh
mkdir -p tmp/pdfs
pdftoppm -png -r 160 -f 1 -singlefile output/pdf/Vlad_Miller_Resume.pdf tmp/pdfs/Vlad_Miller_Resume
```

The document is A4 with restrained colour and remains legible in greyscale. Run the validation script after every content edit; it checks page count, page dimensions, text extraction order, and key ATS terms.
