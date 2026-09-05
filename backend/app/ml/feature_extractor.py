import math
import numpy as np
from typing import Dict, Any, List

class FeatureExtractor:
    FEATURE_NAMES = [
        "file_size_log",
        "entropy",
        "printable_ratio",
        "null_byte_ratio",
        "extension_risk",
        "suspicious_tokens",
        "macro_indicator",
        "pdf_exploit_indicator"
    ]
    
    EXT_RISK_MAP = {
        "exe": 0.95, "dll": 0.95, "bat": 0.90, "ps1": 0.90, "sh": 0.85, "vbs": 0.90,
        "docm": 0.75, "xlsm": 0.75, "zip": 0.50, "pdf": 0.30, "docx": 0.20,
        "xlsx": 0.20, "pptx": 0.20, "txt": 0.05, "csv": 0.05, "png": 0.10, "jpg": 0.10
    }

    @classmethod
    def extract_features(cls, filename: str, content: bytes) -> np.ndarray:
        """Extract a normalized 8-dimensional feature vector for ML models."""
        length = len(content)
        ext = filename.split('.')[-1].lower() if '.' in filename else ''
        
        # 1. Log file size
        size_log = math.log1p(length) / 20.0  # normalize up to ~500MB
        
        # 2. Entropy
        entropy = 0.0
        if length > 0:
            byte_counts = [0] * 256
            for b in content:
                byte_counts[b] += 1
            for count in byte_counts:
                if count > 0:
                    p = count / length
                    entropy -= p * math.log2(p)
        norm_entropy = entropy / 8.0
        
        # 3. Printable character ratio
        printable_count = sum(1 for b in content if 32 <= b <= 126 or b in (9, 10, 13))
        printable_ratio = (printable_count / length) if length > 0 else 0.0
        
        # 4. Null byte ratio
        null_count = sum(1 for b in content if b == 0)
        null_ratio = (null_count / length) if length > 0 else 0.0
        
        # 5. Extension risk
        ext_risk = cls.EXT_RISK_MAP.get(ext, 0.35)
        
        # 6. Suspicious tokens
        lower_content = content.lower()
        token_count = 0
        suspicious_words = [b"powershell", b"cmd.exe", b"eval(", b"wscript", b"activex", b"base64"]
        for word in suspicious_words:
            if word in lower_content:
                token_count += 1
        token_ratio = min(token_count / 3.0, 1.0)
        
        # 7. Macro indicator
        macro_indicator = 1.0 if (b"vbaproject.bin" in lower_content or ext in ['docm', 'xlsm']) else 0.0
        
        # 8. PDF exploit indicator
        pdf_exploit = 0.0
        if ext == 'pdf' or b"%PDF" in content[:1024]:
            if b"/JavaScript" in content or b"/JS" in content:
                pdf_exploit += 0.5
            if b"/Launch" in content:
                pdf_exploit += 0.5
        pdf_exploit = min(pdf_exploit, 1.0)
        
        features = np.array([
            size_log,
            norm_entropy,
            printable_ratio,
            null_ratio,
            ext_risk,
            token_ratio,
            macro_indicator,
            pdf_exploit
        ], dtype=np.float32)
        
        return features

    @classmethod
    def get_feature_dict(cls, vector: np.ndarray) -> Dict[str, float]:
        return {name: float(round(val, 4)) for name, val in zip(cls.FEATURE_NAMES, vector)}

feature_extractor = FeatureExtractor()
