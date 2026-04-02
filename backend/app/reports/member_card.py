from __future__ import annotations

from io import BytesIO
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A7
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

from app.core.config import get_settings
from app.models.member import Member
from app.utils.crypto import decrypt_value

settings = get_settings()


def _register_font() -> None:
    try:
        pdfmetrics.getFont("Sarabun")
    except KeyError:
        pdfmetrics.registerFont(TTFont("Sarabun", settings.sarabun_font_path))


def generate_member_card(member: Member) -> bytes:
    _register_font()
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A7)
    width, height = A7

    c.setFillColor(colors.HexColor("#1f6aa5"))
    c.rect(0, height - 40, width, 40, stroke=0, fill=1)
    c.setFillColor(colors.white)
    c.setFont("Sarabun", 16)
    c.drawString(10, height - 30, "Smart Library")

    c.setFillColor(colors.black)
    c.setFont("Sarabun", 12)
    c.drawString(10, height - 60, member.full_name)
    c.setFont("Sarabun", 10)
    c.drawString(10, height - 75, f"Member ID: {member.member_id}")
    c.drawString(10, height - 90, f"Type: {member.member_type.title()}")
    try:
        national_id = decrypt_value(member.encrypted_national_id)
    except Exception:
        national_id = "Hidden"
    c.drawString(10, height - 105, f"National ID: {national_id[:4]}••••{national_id[-2:]}" if national_id != "Hidden" else "National ID: Hidden")

    if member.qr_code_path:
        qr_path = Path(member.qr_code_path)
        if qr_path.exists():
            qr_image = ImageReader(qr_path.open("rb"))
            c.drawImage(qr_image, width - 90, height - 140, width=70, height=70, preserveAspectRatio=True)

    c.setFont("Sarabun", 8)
    c.setFillColor(colors.HexColor("#7a7a7a"))
    c.drawString(10, 10, "Scan QR to verify membership")
    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer.read()
