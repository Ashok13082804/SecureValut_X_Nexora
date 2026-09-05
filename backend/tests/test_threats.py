from backend.app.ai.threat_analyzer import threat_analyzer
from backend.app.nlp.dlp_analyzer import dlp_analyzer

def test_threat_analyzer_clean_file():
    clean_pdf = b"%PDF-1.4\n1 0 obj\n<< /Title (Annual Report) >>\nendobj\n%%EOF"
    res = threat_analyzer.analyze_file("report.pdf", clean_pdf, "application/pdf")
    
    assert res["threat_score"] <= 20
    assert res["classification"] == "Safe"
    assert res["has_macros"] is False
    assert res["has_pdf_javascript"] is False

def test_threat_analyzer_malicious_pdf():
    malicious_pdf = b"%PDF-1.4\n1 0 obj\n<< /JavaScript << /JS (eval(unescape('%u9090%u9090'))); >> >>\nendobj\n%%EOF"
    res = threat_analyzer.analyze_file("invoice.pdf", malicious_pdf, "application/pdf")
    
    assert res["has_pdf_javascript"] is True
    assert res["threat_score"] >= 35

def test_dlp_sensitive_data_detection():
    doc_text = b"Confidential API keys: AKIAIOSFODNN7EXAMPLE and OpenAI sk-abcdef1234567890abcdef1234567890. Email contact: admin@defense.gov"
    res = dlp_analyzer.analyze_content("keys.txt", doc_text)
    
    assert res["sensitivity_classification"] in ["Confidential", "Highly Confidential"]
    assert res["api_key_count"] >= 1
    assert res["email_count"] >= 1
