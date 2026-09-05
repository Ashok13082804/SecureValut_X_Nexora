import io
import datetime
from PIL import Image, ImageDraw, ImageFont
import pypdf
from reportlab.pdfgen import canvas
from reportlab.lib.colors import Color

class WatermarkService:
    @staticmethod
    def create_pdf_watermark_layer(text: str, width: float, height: float) -> io.BytesIO:
        """Create a PDF overlay containing rotated semi-transparent watermark text."""
        packet = io.BytesIO()
        c = canvas.Canvas(packet, pagesize=(width, height))
        
        # Transparent gray
        c.setFillColor(Color(0.5, 0.5, 0.5, alpha=0.25))
        c.setFont("Helvetica-Bold", 24)
        
        # Draw diagonal watermark across the page
        c.saveState()
        c.translate(width / 2.0, height / 2.0)
        c.rotate(45)
        c.drawCentredString(0, 0, text)
        c.drawCentredString(0, -40, f"TIMESTAMP: {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}")
        c.restoreState()
        
        # Also draw small footer
        c.setFont("Helvetica", 9)
        c.setFillColor(Color(0.3, 0.3, 0.3, alpha=0.6))
        c.drawString(30, 20, f"SECUREAI VAULT PROTECTED • {text}")
        
        c.save()
        packet.seek(0)
        return packet

    @classmethod
    def apply_pdf_watermark(cls, pdf_bytes: bytes, recipient_info: str) -> bytes:
        """Dynamically apply watermark to all pages of a PDF in memory."""
        try:
            reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
            writer = pypdf.PdfWriter()
            
            watermark_text = f"CONFIDENTIAL - {recipient_info}"
            
            for page in reader.pages:
                width = float(page.mediabox.width)
                height = float(page.mediabox.height)
                
                watermark_stream = cls.create_pdf_watermark_layer(watermark_text, width, height)
                watermark_reader = pypdf.PdfReader(watermark_stream)
                watermark_page = watermark_reader.pages[0]
                
                page.merge_page(watermark_page)
                writer.add_page(page)
                
            output_stream = io.BytesIO()
            writer.write(output_stream)
            return output_stream.getvalue()
        except Exception:
            # If PDF parsing fails (e.g. malformed or encrypted), return original data safely
            return pdf_bytes

    @classmethod
    def apply_image_watermark(cls, image_bytes: bytes, recipient_info: str) -> bytes:
        """Dynamically apply watermark to an image in memory."""
        try:
            img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
            overlay = Image.new("RGBA", img.size, (255, 255, 255, 0))
            draw = ImageDraw.Draw(overlay)
            
            w, h = img.size
            watermark_text = f"SECURE VAULT - CONFIDENTIAL • {recipient_info}"
            
            # Draw semi-transparent banner at bottom
            draw.rectangle([(0, h - 40), (w, h)], fill=(0, 0, 0, 140))
            draw.text((20, h - 30), watermark_text, fill=(255, 255, 255, 220))
            
            watermarked = Image.alpha_composite(img, overlay)
            out = io.BytesIO()
            watermarked.convert("RGB").save(out, format="JPEG", quality=92)
            return out.getvalue()
        except Exception:
            return image_bytes

    @classmethod
    def apply_text_watermark(cls, text_bytes: bytes, recipient_info: str) -> bytes:
        """Prepend dynamic security classification banner to text/csv."""
        try:
            header = (
                f"// ==========================================================================\n"
                f"// SECUREAI VAULT CLASSIFIED DOCUMENT\n"
                f"// RECIPIENT: {recipient_info}\n"
                f"// ACCESS TIMESTAMP: {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}\n"
                f"// UNLAWFUL DUPLICATION, EXFILTRATION, OR REDISTRIBUTION IS STRICTLY FORBIDDEN\n"
                f"// ==========================================================================\n\n"
            ).encode('utf-8')
            return header + text_bytes
        except Exception:
            return text_bytes

    @classmethod
    def watermark_file(cls, file_data: bytes, extension: str, recipient_info: str) -> bytes:
        """Route watermark dynamically based on file type."""
        ext = extension.lower().lstrip('.')
        if ext == 'pdf':
            return cls.apply_pdf_watermark(file_data, recipient_info)
        elif ext in ['jpg', 'jpeg', 'png', 'gif']:
            return cls.apply_image_watermark(file_data, recipient_info)
        elif ext in ['txt', 'csv']:
            return cls.apply_text_watermark(file_data, recipient_info)
        return file_data

watermark_service = WatermarkService()
