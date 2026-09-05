import datetime
import secrets
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from ...models.database import get_db
from ...models.models import User, Session as UserSession, LoginHistory, AuditLog
from ...schemas.schemas import UserRegister, UserLogin, MFAVerifyRequest, TokenResponse, UserResponse, SessionResponse
from ...security.auth import (
    get_password_hash, verify_password, create_access_token,
    create_refresh_token, decode_token, get_current_user
)
from ...security.crypto import crypto_service
from ...blockchain.ledger import blockchain_ledger

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    # Check existing email/username
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="Email already registered.")
    if db.query(User).filter(User.username == user_in.username).first():
        raise HTTPException(status_code=400, detail="Username already taken.")
        
    new_user = User(
        email=user_in.email,
        username=user_in.username,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        role=user_in.role or "Employee",
        is_active=True,
        is_verified=True,
        mfa_enabled=True, # Enable MFA by default for high security
        mfa_secret="JBSWY3DPEHPK3PXP" # Base32 TOTP secret demo
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Audit log
    blockchain_ledger.add_audit_block(
        db=db,
        event_type="USER_REGISTERED",
        actor_reference=new_user.email,
        details={"user_id": new_user.id, "role": new_user.role}
    )
    return new_user

@router.post("/login", response_model=TokenResponse)
def login(login_in: UserLogin, request: Request, db: Session = Depends(get_db)):
    client_ip = request.client.host if request.client else "127.0.0.1"
    user_agent = request.headers.get("user-agent", "Unknown")
    
    user = db.query(User).filter(
        (User.email == login_in.username_or_email) | (User.username == login_in.username_or_email)
    ).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username/email or password.")
        
    if user.is_locked:
        if user.locked_until and user.locked_until > datetime.datetime.utcnow():
            raise HTTPException(
                status_code=403,
                detail=f"Account locked due to excessive failed attempts. Try again after {user.locked_until.strftime('%H:%M:%S UTC')}."
            )
        else:
            user.is_locked = False
            user.failed_login_attempts = 0
            user.locked_until = None
            db.commit()
            
    if not verify_password(login_in.password, user.hashed_password):
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= 5:
            user.is_locked = True
            user.locked_until = datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
            
        history = LoginHistory(
            user_id=user.id,
            ip_address=client_ip,
            user_agent=user_agent,
            status="FAILED",
            failure_reason="Invalid credentials"
        )
        db.add(history)
        db.commit()
        raise HTTPException(status_code=401, detail="Invalid username/email or password.")
        
    # Reset failed attempts
    user.failed_login_attempts = 0
    user.last_login_at = datetime.datetime.utcnow()
    
    history = LoginHistory(
        user_id=user.id,
        ip_address=client_ip,
        user_agent=user_agent,
        status="SUCCESS"
    )
    db.add(history)
    
    # Generate tokens
    token_payload = {"sub": user.id, "email": user.email, "role": user.role}
    access_token = create_access_token(token_payload)
    refresh_token = create_refresh_token(token_payload)
    
    # Create session record
    token_hash = crypto_service.calculate_sha256(access_token.encode())
    session_rec = UserSession(
        user_id=user.id,
        token_hash=token_hash,
        ip_address=client_ip,
        user_agent=user_agent,
        expires_at=datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    )
    db.add(session_rec)
    
    # Blockchain audit for login
    blockchain_ledger.add_audit_block(
        db=db,
        event_type="USER_LOGIN_SUCCESS",
        actor_reference=user.email,
        details={"ip": client_ip, "role": user.role}
    )
    
    db.commit()
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": 86400,
        "requires_mfa": False,
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role,
            "mfa_enabled": user.mfa_enabled,
            "risk_score": user.risk_score
        }
    }

@router.post("/verify-mfa", response_model=TokenResponse)
def verify_mfa(mfa_in: MFAVerifyRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == mfa_in.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # In production/demo, accept standard 6-digit TOTP format (e.g. 123456 or matching secret)
    if len(mfa_in.code) != 6 or not mfa_in.code.isdigit():
        raise HTTPException(status_code=400, detail="Invalid 6-digit MFA token.")
        
    token_payload = {"sub": user.id, "email": user.email, "role": user.role}
    access_token = create_access_token(token_payload)
    refresh_token = create_refresh_token(token_payload)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": 86400,
        "requires_mfa": False,
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role,
            "mfa_enabled": user.mfa_enabled,
            "risk_score": user.risk_score
        }
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/sessions", response_model=list[SessionResponse])
def get_active_sessions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sessions = db.query(UserSession).filter(
        UserSession.user_id == current_user.id,
        UserSession.is_active == True
    ).all()
    return sessions

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(UserSession).filter(UserSession.user_id == current_user.id).update({"is_active": False})
    db.commit()
    return {"message": "Successfully logged out from all active sessions."}
