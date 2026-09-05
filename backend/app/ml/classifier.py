import numpy as np
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from typing import Dict, Any
from .feature_extractor import feature_extractor

class MLThreatClassifier:
    def __init__(self):
        self.rf_model = RandomForestClassifier(n_estimators=50, random_state=42)
        self.iso_forest = IsolationForest(n_estimators=50, contamination=0.1, random_state=42)
        self.is_trained = False
        self._initialize_and_train_baseline()

    def _initialize_and_train_baseline(self):
        """Train baseline Random Forest and Isolation Forest on realistic cybersecurity feature distributions."""
        np.random.seed(42)
        n_clean = 400
        n_malicious = 200
        
        # Clean features: moderate size, low/medium entropy (0.3-0.6), high printable ratio (0.8-1.0), low null bytes, low tokens, 0 macros
        clean_features = np.column_stack([
            np.random.uniform(0.1, 0.6, n_clean),   # size_log
            np.random.uniform(0.25, 0.65, n_clean), # norm_entropy
            np.random.uniform(0.75, 1.0, n_clean),  # printable_ratio
            np.random.uniform(0.0, 0.05, n_clean),  # null_ratio
            np.random.choice([0.05, 0.1, 0.2, 0.3], n_clean), # ext_risk
            np.random.uniform(0.0, 0.05, n_clean),  # suspicious_tokens
            np.zeros(n_clean),                      # macro_indicator
            np.zeros(n_clean)                       # pdf_exploit_indicator
        ])
        
        # Binary/packed malware (100 samples): high entropy, low printable, high null bytes, high extension risk
        n_bin_mal = 100
        binary_malicious = np.column_stack([
            np.random.uniform(0.2, 0.8, n_bin_mal),
            np.random.uniform(0.70, 1.0, n_bin_mal), # high entropy
            np.random.uniform(0.05, 0.5, n_bin_mal), # low printable
            np.random.uniform(0.1, 0.4, n_bin_mal),  # high null
            np.random.choice([0.85, 0.95], n_bin_mal),
            np.random.uniform(0.0, 0.4, n_bin_mal),
            np.zeros(n_bin_mal),
            np.random.choice([0.0, 0.5, 1.0], n_bin_mal, p=[0.7, 0.2, 0.1])
        ])
        
        # Script/Macro/Document threats (100 samples): high printable, moderate entropy, high suspicious tokens or macros
        n_script_mal = 100
        script_malicious = np.column_stack([
            np.random.uniform(0.05, 0.4, n_script_mal),
            np.random.uniform(0.3, 0.65, n_script_mal), # moderate entropy
            np.random.uniform(0.8, 1.0, n_script_mal),  # high printable (ASCII/script)
            np.random.uniform(0.0, 0.05, n_script_mal), # low null
            np.random.choice([0.75, 0.85, 0.90, 0.95], n_script_mal), # ps1, bat, vbs, docm
            np.random.uniform(0.33, 1.0, n_script_mal), # multiple suspicious tokens
            np.random.choice([0.0, 1.0], n_script_mal, p=[0.5, 0.5]),
            np.random.choice([0.0, 0.5, 1.0], n_script_mal, p=[0.6, 0.2, 0.2])
        ])
        
        malicious_features = np.vstack([binary_malicious, script_malicious])
        X = np.vstack([clean_features, malicious_features])
        y = np.array([0] * n_clean + [1] * (n_bin_mal + n_script_mal))
        
        self.rf_model.fit(X, y)
        self.iso_forest.fit(clean_features) # fit isolation forest on clean baseline
        self.is_trained = True

    def predict(self, filename: str, content: bytes) -> Dict[str, Any]:
        """Perform ML classification and deep anomaly estimation on a file."""
        feat_vector = feature_extractor.extract_features(filename, content)
        X = feat_vector.reshape(1, -1)
        
        # Random forest prediction
        probs = self.rf_model.predict_proba(X)[0]
        malicious_prob = float(probs[1]) if len(probs) > 1 else 0.0
        prediction_label = "Malicious" if malicious_prob > 0.5 else "Clean"
        confidence = float(probs[1] if malicious_prob > 0.5 else probs[0])
        risk_score = round(malicious_prob * 100.0, 1)
        
        # Isolation Forest Anomaly Score (reconstruction error simulation)
        # decision_function returns negative for outliers, positive for inliers
        raw_anomaly = float(self.iso_forest.decision_function(X)[0])
        # Normalize anomaly score from 0.0 (normal) to 1.0 (highly anomalous)
        anomaly_score = round(float(np.clip(0.5 - (raw_anomaly * 1.5), 0.0, 1.0)), 3)
        
        # Feature importance / contribution for explainability
        rf_importances = self.rf_model.feature_importances_
        feature_dict = feature_extractor.get_feature_dict(feat_vector)
        feature_contributions = {}
        for (name, val), imp in zip(feature_dict.items(), rf_importances):
            contribution = round(float(val * imp * 100.0), 2)
            feature_contributions[name] = contribution
            
        return {
            "model_name": "RandomForest_IsolationForest_Ensemble",
            "model_version": "2.4.0",
            "prediction_label": prediction_label,
            "confidence": round(confidence, 3),
            "risk_score": risk_score,
            "anomaly_score": anomaly_score,
            "feature_importance": feature_contributions,
            "raw_features": feature_dict
        }

ml_classifier = MLThreatClassifier()
