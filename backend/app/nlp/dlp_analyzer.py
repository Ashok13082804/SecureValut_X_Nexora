import re
from typing import Dict, Any, List
from .document_parser import document_parser

class DLPAnalyzer:
    EMAIL_REGEX = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
    PHONE_REGEX = re.compile(r'(?:\+?[0-9]{1,3}[-.\s]?)?(?:\(?[0-9]{3}\)?[-.\s]?)?[0-9]{3}[-.\s]?[0-9]{4}\b')
    API_KEY_PATTERNS = [
        (re.compile(r'\bAKIA[0-9A-Z]{16}\b'), "AWS Access Key"),
        (re.compile(r'\bsk-[a-zA-Z0-9]{32,}\b'), "OpenAI API Key"),
        (re.compile(r'\bgh[pousr]_[A-Za-z0-9_]{36}\b'), "GitHub Personal Access Token"),
        (re.compile(r'\b(?:bearer\s+)?[A-Za-z0-9-_]{20,}\.[A-Za-z0-9-_]{20,}\.[A-Za-z0-9-_]{20,}\b', re.I), "JWT Token"),
        (re.compile(r'\b[0-9a-fA-F]{32,64}\b'), "Hex Security Secret"),
        (re.compile(r'(?:password|secret|passwd|token)\s*[:=]\s*["\']?([^"\'\s]{8,})["\']?', re.I), "Plaintext Credential")
    ]
    CREDIT_CARD_REGEX = re.compile(r'\b(?:\d{4}[-\s]?){3}\d{4}\b')
    
    CONFIDENTIAL_TERMS = [
        "confidential", "strictly private", "internal use only",
        "proprietary", "trade secret", "restricted", "do not disclose",
        "privileged communication", "nda protected", "financial audit",
        "top secret", "salary", "compensation plan", "api secret"
    ]

    @classmethod
    def mask_secret(cls, secret_str: str) -> str:
        """Mask sensitive value for safe preview e.g. AKIA************12AB."""
        if len(secret_str) <= 6:
            return "***"
        return secret_str[:4] + "*" * (len(secret_str) - 8) + secret_str[-4:]

    @classmethod
    def analyze_content(cls, filename: str, content: bytes) -> Dict[str, Any]:
        """
        Analyze extracted document text for sensitive information, credentials,
        and classify confidentiality tier.
        """
        text = document_parser.extract_text(filename, content)
        lower_text = text.lower()
        
        # 1. Detect emails
        emails = list(set(cls.EMAIL_REGEX.findall(text)))
        
        # 2. Detect phone numbers
        phones = list(set(cls.PHONE_REGEX.findall(text)))
        
        # 3. Detect API keys & secrets
        found_tokens = []
        for pattern, label in cls.API_KEY_PATTERNS:
            matches = pattern.findall(text)
            for m in matches:
                val = m if isinstance(m, str) else m[0]
                found_tokens.append({
                    "type": label,
                    "preview": cls.mask_secret(val)
                })
                
        # 4. Detect confidential terminology
        found_confidential_terms = []
        for term in cls.CONFIDENTIAL_TERMS:
            if term in lower_text:
                found_confidential_terms.append(term.upper())
                
        # 5. Determine Document Classification
        email_cnt = len(emails)
        phone_cnt = len(phones)
        token_cnt = len(found_tokens)
        term_cnt = len(found_confidential_terms)
        
        sample_snippets = []
        if found_tokens:
            sample_snippets.append(f"Security Alert: Discovered {len(found_tokens)} API Key/Credential token(s) embedded in content.")
        if term_cnt > 0:
            sample_snippets.append(f"Classified markers identified: {', '.join(found_confidential_terms[:4])}")
        if email_cnt > 0:
            sample_snippets.append(f"Identified {email_cnt} unique email address(es).")
            
        # Scoring logic
        if token_cnt > 0 or term_cnt >= 4:
            classification = "Highly Confidential"
            confidence = 0.96
        elif term_cnt > 0 or email_cnt > 3 or phone_cnt > 2:
            classification = "Confidential"
            confidence = 0.92
        elif email_cnt > 0 or phone_cnt > 0:
            classification = "Internal"
            confidence = 0.88
        else:
            classification = "Public"
            confidence = 0.95
            
        return {
            "sensitivity_classification": classification,
            "confidence": confidence,
            "confidential_terms_count": term_cnt,
            "email_count": email_cnt,
            "phone_count": phone_cnt,
            "api_key_count": token_cnt,
            "detected_entities": {
                "emails": emails[:10],
                "phones": phones[:10],
                "tokens": found_tokens[:10],
                "confidential_terms": found_confidential_terms
            },
            "sample_snippets": sample_snippets
        }

dlp_analyzer = DLPAnalyzer()
