from pydantic import BaseModel
from fastapi import APIRouter, Depends
from ...security.auth import get_current_user
from ...ml.model_store import model_store
from ...ml.classifier import ml_classifier

router = APIRouter(prefix="/ai-ml", tags=["Machine Learning"])

class TestInferenceRequest(BaseModel):
    filename: str
    sample_text: str

@router.get("/metrics")
def get_ml_metrics(current_user = Depends(get_current_user)):
    """Retrieve production model evaluation metrics and confusion matrix."""
    return model_store.get_metrics()

@router.post("/test-inference")
def test_inference(payload: TestInferenceRequest, current_user = Depends(get_current_user)):
    """Test ML threat classification and deep anomaly detection on arbitrary payload."""
    content_bytes = payload.sample_text.encode('utf-8')
    result = ml_classifier.predict(payload.filename, content_bytes)
    return result
