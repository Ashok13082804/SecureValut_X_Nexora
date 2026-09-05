import pytest
from backend.app.ml.feature_extractor import feature_extractor
from backend.app.ml.classifier import ml_classifier

def test_feature_extractor_clean_text():
    content = b"This is a clean confidential financial report with regular text."
    features = feature_extractor.extract_features("report.txt", content)
    assert len(features) == 8
    feat_dict = feature_extractor.get_feature_dict(features)
    assert feat_dict["printable_ratio"] > 0.9
    assert feat_dict["macro_indicator"] == 0.0
    assert feat_dict["pdf_exploit_indicator"] == 0.0

def test_feature_extractor_suspicious_payload():
    # Payload with powershell and macro
    content = b"vbaProject.bin powershell.exe -enc AAAAA eval( base64"
    features = feature_extractor.extract_features("invoice.docm", content)
    assert len(features) == 8
    feat_dict = feature_extractor.get_feature_dict(features)
    assert feat_dict["macro_indicator"] == 1.0
    assert feat_dict["suspicious_tokens"] > 0.5
    assert feat_dict["extension_risk"] == 0.75

def test_ml_prediction_clean():
    content = b"Dear team, please find attached the quarterly enterprise audit summary."
    result = ml_classifier.predict("summary.docx", content)
    assert "prediction_label" in result
    assert result["prediction_label"] in ["Clean", "Malicious"]
    assert "confidence" in result
    assert "risk_score" in result
    assert "anomaly_score" in result
    assert "feature_importance" in result
    assert result["risk_score"] < 50.0

def test_ml_prediction_malicious_script():
    content = b"powershell.exe -ExecutionPolicy Bypass -Command 'wscript.shell eval( base64 cmd.exe activex'"
    result = ml_classifier.predict("exploit.ps1", content)
    assert result["risk_score"] > 50.0
    assert result["prediction_label"] == "Malicious"
