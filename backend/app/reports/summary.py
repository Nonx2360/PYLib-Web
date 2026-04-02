from datetime import datetime
from io import BytesIO

from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

from app.core.config import get_settings


settings = get_settings()


def _register_fonts() -> None:
    try:
        pdfmetrics.getFont("Sarabun")
    except KeyError:
        pdfmetrics.registerFont(TTFont("Sarabun", settings.sarabun_font_path))


def generate_summary_report(stats: dict[str, int]) -> bytes:
    _register_fonts()
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    c.setFont("Sarabun", 16)
    c.drawString(50, 800, "Smart Library Summary Report")
    c.setFont("Sarabun", 12)
    c.drawString(50, 780, f"Generated at: {datetime.utcnow():%Y-%m-%d %H:%M UTC}")
    y = 740
    for label, value in stats.items():
        c.drawString(50, y, f"{label}: {value}")
        y -= 20
    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer.read()
