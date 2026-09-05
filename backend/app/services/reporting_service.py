import io
import csv
import json
import datetime
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from sqlalchemy.orm import Session
from ..models.models import File, ThreatDetection, Incident, AuditLog, BlockchainBlock

class ReportingService:
    @staticmethod
    def generate_json_report(data: dict) -> str:
        return json.dumps(data, indent=2, default=str)

    @staticmethod
    def generate_csv_report(rows: list, fieldnames: list) -> str:
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)
        return output.getvalue()

    @staticmethod
    def generate_pdf_summary_report(db: Session) -> bytes:
        """Generate a PDF cybersecurity audit report."""
        packet = io.BytesIO()
        c = canvas.Canvas(packet, pagesize=letter)
        w, h = letter

        # Header banner
        c.setFillColor(colors.HexColor("#0f172a")) # Slate-900
        c.rect(0, h - 80, w, 80, fill=1, stroke=0)
        
        c.setFillColor(colors.HexColor("#38bdf8")) # Sky-400
        c.setFont("Helvetica-Bold", 20)
        c.drawString(40, h - 45, "SECUREAI VAULT")
        
        c.setFillColor(colors.white)
        c.setFont("Helvetica", 11)
        c.drawString(220, h - 43, "Enterprise Threat Defense & Blockchain Audit Report")
        
        c.setFillColor(colors.HexColor("#94a3b8"))
        c.setFont("Helvetica", 8)
        c.drawRightString(w - 40, h - 43, f"GENERATED: {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}")

        # Metrics overview
        total_files = db.query(File).count()
        quarantined = db.query(File).filter(File.is_quarantined == True).count()
        open_incidents = db.query(Incident).filter(Incident.status == "OPEN").count()
        blocks = db.query(BlockchainBlock).count()

        c.setFillColor(colors.HexColor("#1e293b"))
        c.rect(40, h - 160, w - 80, 60, fill=1, stroke=0)
        
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(60, h - 120, "Total Monitored Files")
        c.drawString(190, h - 120, "Quarantined Files")
        c.drawString(320, h - 120, "Open Incidents")
        c.drawString(450, h - 120, "Blockchain Blocks")
        
        c.setFont("Helvetica-Bold", 16)
        c.setFillColor(colors.HexColor("#38bdf8"))
        c.drawString(60, h - 145, str(total_files))
        c.setFillColor(colors.HexColor("#f87171"))
        c.drawString(190, h - 145, str(quarantined))
        c.setFillColor(colors.HexColor("#fbbf24"))
        c.drawString(320, h - 145, str(open_incidents))
        c.setFillColor(colors.HexColor("#34d399"))
        c.drawString(450, h - 145, str(blocks))

        # Recent Threats Table
        c.setFillColor(colors.HexColor("#0f172a"))
        c.setFont("Helvetica-Bold", 13)
        c.drawString(40, h - 195, "Active Security Threats & Detections")
        
        threats = db.query(ThreatDetection).order_by(ThreatDetection.threat_score.desc()).limit(8).all()
        y = h - 225
        
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(colors.HexColor("#64748b"))
        c.drawString(45, y, "FILE ID")
        c.drawString(180, y, "THREAT SCORE")
        c.drawString(280, y, "CLASSIFICATION")
        c.drawString(400, y, "ENTROPY")
        c.drawString(480, y, "MACROS / JS")
        
        c.setStrokeColor(colors.HexColor("#cbd5e1"))
        c.line(40, y - 5, w - 40, y - 5)
        y -= 20
        
        c.setFont("Helvetica", 9)
        c.setFillColor(colors.HexColor("#1e293b"))
        for t in threats:
            c.drawString(45, y, t.file_id[:16] + "...")
            c.drawString(180, y, f"{t.threat_score}/100")
            c.drawString(280, y, t.classification)
            c.drawString(400, y, f"{t.entropy:.2f} bits")
            c.drawString(480, y, "YES" if (t.has_macros or t.has_pdf_javascript) else "NO")
            y -= 18

        # Footer
        c.setFillColor(colors.HexColor("#64748b"))
        c.setFont("Helvetica", 8)
        c.drawString(40, 30, "CONFIDENTIAL & PROPRIETARY — SECUREAI VAULT INTERNAL AUDIT REPORT")
        c.drawRightString(w - 40, 30, "PAGE 1 OF 1")

        c.save()
        packet.seek(0)
        return packet.getvalue()

reporting_service = ReportingService()
