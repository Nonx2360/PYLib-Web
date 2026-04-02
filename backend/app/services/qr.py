from pathlib import Path

import qrcode


def generate_qr_code(value: str, output_dir: Path) -> str:
    output_dir.mkdir(parents=True, exist_ok=True)
    file_path = output_dir / f"{value}.png"
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(value)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    img.save(file_path)
    return str(file_path)
