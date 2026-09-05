from .auth import router as auth_router
from .files import router as files_router
from .shares import router as shares_router
from .threats import router as threats_router
from .ml import router as ml_router
from .nlp import router as nlp_router
from .blockchain import router as blockchain_router
from .analytics import router as analytics_router
from .ueba import router as ueba_router
from .incidents import router as incidents_router
from .forensics import router as forensics_router
from .policies import router as policies_router
from .audit import router as audit_router
from .reports import router as reports_router
from .users import router as users_router
from .demo import router as demo_router

__all__ = [
    "auth_router", "files_router", "shares_router", "threats_router",
    "ml_router", "nlp_router", "blockchain_router", "analytics_router",
    "ueba_router", "incidents_router", "forensics_router", "policies_router",
    "audit_router", "reports_router", "users_router", "demo_router"
]
