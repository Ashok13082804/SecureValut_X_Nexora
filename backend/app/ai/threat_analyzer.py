import math
import re
import zipfile
import io
from typing import Dict, Any, List

class ThreatAnalyzer:
    @staticmethod
    def calculate_entropy(data: bytes) -> float:
        """Calculate Shannon entropy of byte data (0.0 - 8.0)."""
        if not data:
            return 0.0
        entropy = 0.0
        length = len(data)
        byte_counts = [0] * 256
        for b in data:
            byte_counts[b] += 1
        for count in byte_counts:
            if count > 0:
                p_x = float(count) / length
                entropy -= p_x * math.log2(p_x)
        return round(entropy, 3)

    @classmethod
    def scan_pdf(cls, data: bytes) -> Dict[str, Any]:
        """Scan raw PDF byte data for malicious indicators."""
        results = {
            "has_javascript": False,
            "has_launch_action": False,
            "has_embedded_files": False,
            "suspicious_tags": []
        }
        pdf_indicators = [
            (b"/JavaScript", "Embedded JavaScript Engine"),
            (b"/JS", "Direct JS stream invocation"),
            (b"/Launch", "OS Executable Launch Action"),
            (b"/EmbeddedFiles", "Embedded Binary Payload"),
            (b"/OpenAction", "Automatic Execution Trigger on Open"),
            (b"/RichMedia", "Interactive Flash/ActiveX Element")
        ]
        for tag, desc in pdf_indicators:
            if tag in data:
                results["suspicious_tags"].append(desc)
                if tag in [b"/JavaScript", b"/JS"]:
                    results["has_javascript"] = True
                if tag == b"/Launch":
                    results["has_launch_action"] = True
                if tag == b"/EmbeddedFiles":
                    results["has_embedded_files"] = True
        return results

    @classmethod
    def scan_office_macros(cls, data: bytes) -> Dict[str, Any]:
        """Inspect Office OpenXML / ZIP files for VBA macros and suspicious relationships."""
        results = {"has_macros": False, "macro_files": []}
        try:
            with zipfile.ZipFile(io.BytesIO(data)) as zf:
                for name in zf.namelist():
                    name_lower = name.lower()
                    if "vbaproject.bin" in name_lower or "macro" in name_lower or name_lower.endswith(".vba"):
                        results["has_macros"] = True
                        results["macro_files"].append(name)
        except Exception:
            # Not a valid zip or corrupted
            pass
        return results

    @classmethod
    def scan_suspicious_strings(cls, data: bytes) -> List[str]:
        """Scan raw bytes for command execution and payload indicators."""
        patterns = [
            (rb"powershell(?:\.exe)?", "PowerShell invocation"),
            (rb"cmd(?:\.exe)?\s+/c", "Command shell execution (/c)"),
            (rb"wscript\.shell", "Windows Scripting Host automation"),
            (rb"ActiveXObject", "ActiveX script object"),
            (rb"eval\s*\(", "Dynamic script execution (eval)"),
            (rb"/bin/(?:ba)?sh", "Unix Shell execution"),
            (rb"curl\s+-[sS]?[kK]?", "Remote payload retrieval (curl)"),
            (rb"wget\s+", "Remote payload download (wget)"),
            (rb"certutil\s+-urlcache", "Certutil binary download abuse"),
            (rb"Invoke-Expression|IEX", "PowerShell memory execution (IEX)")
        ]
        found = []
        for pat, label in patterns:
            if re.search(pat, data, re.IGNORECASE):
                found.append(label)
        return found

    @classmethod
    def analyze_file(cls, filename: str, content: bytes, mime_type: str) -> Dict[str, Any]:
        """
        Execute full multi-factor static analysis on uploaded file.
        Returns threat score (0-100), classification, reasons, and raw indicators.
        """
        ext = filename.split('.')[-1].lower() if '.' in filename else ''
        file_size = len(content)
        entropy = cls.calculate_entropy(content)
        
        reasons = []
        suspicious_strings = cls.scan_suspicious_strings(content)
        has_macros = False
        has_pdf_js = False
        has_launch = False
        abnormal_structure = False
        
        score = 0
        
        # 1. Entropy analysis
        if entropy > 7.5:
            score += 35
            reasons.append(f"Abnormally high Shannon entropy ({entropy}/8.0) indicates packed, obfuscated, or encrypted binary code.")
        elif entropy > 7.0:
            score += 15
            reasons.append(f"Elevated entropy ({entropy}/8.0) suggests compressed or obscured payload segments.")
            
        # 2. PDF specific analysis
        if ext == 'pdf' or b"%PDF-" in content[:1024]:
            pdf_scan = cls.scan_pdf(content)
            if pdf_scan["has_javascript"]:
                has_pdf_js = True
                score += 35
                reasons.append("PDF contains embedded JavaScript streams (/JS, /JavaScript).")
            if pdf_scan["has_launch_action"]:
                has_launch = True
                score += 45
                reasons.append("Critical threat: PDF contains /Launch action attempting direct OS process execution.")
            if pdf_scan["has_embedded_files"]:
                score += 20
                reasons.append("PDF contains embedded sub-files/attachments.")
                
        # 3. Office Macro analysis
        if ext in ['docx', 'xlsx', 'pptx', 'docm', 'xlsm'] or content[:4] == b"PK\x03\x04":
            macro_scan = cls.scan_office_macros(content)
            if macro_scan["has_macros"]:
                has_macros = True
                score += 40
                reasons.append(f"Detected embedded VBA macro project ({', '.join(macro_scan['macro_files'])}).")
                
        # 4. Dangerous file extensions
        dangerous_exts = {'exe', 'bat', 'sh', 'vbs', 'ps1', 'dll', 'so', 'scr', 'cmd', 'hta'}
        if ext in dangerous_exts:
            score += 55
            reasons.append(f"High risk executable extension (.{ext}) blocked by default security posture.")
            
        # 5. Suspicious strings
        if suspicious_strings:
            score += min(len(suspicious_strings) * 20, 50)
            reasons.append(f"Identified suspicious execution strings: {', '.join(suspicious_strings)}.")
            
        # 6. File structure checks (MIME vs Magic)
        if ext == 'pdf' and not content.startswith(b'%PDF'):
            abnormal_structure = True
            score += 25
            reasons.append("MIME mismatch: File has .pdf extension but lacks standard %PDF magic header.")
        elif ext in ['png', 'jpg', 'jpeg'] and entropy > 7.9 and len(content) < 1000:
            abnormal_structure = True
            score += 20
            reasons.append("Suspicious image structural header anomalies.")
            
        # Cap score at 100
        threat_score = min(score, 100)
        
        # Classification
        if threat_score <= 20:
            classification = "Safe"
            recommendation = "File verified clean. Approved for standard organization storage and sharing."
            if not reasons:
                reasons.append("Standard file structure and clean byte distribution verified.")
        elif threat_score <= 50:
            classification = "Low Risk"
            recommendation = "Low security concern. Standard user precautions apply."
        elif threat_score <= 75:
            classification = "Suspicious"
            recommendation = "Quarantine or restrict sharing until review by a Security Administrator."
        else:
            classification = "High Risk"
            recommendation = "Critical threat detected. Automatic quarantine initiated. Sharing blocked."
            
        return {
            "threat_score": threat_score,
            "classification": classification,
            "entropy": entropy,
            "has_macros": has_macros,
            "has_embedded_scripts": has_pdf_js or has_launch or bool(suspicious_strings),
            "has_pdf_javascript": has_pdf_js,
            "abnormal_structure": abnormal_structure,
            "suspicious_strings": suspicious_strings,
            "explainable_reasons": reasons,
            "recommendation": recommendation
        }

threat_analyzer = ThreatAnalyzer()
