"""
SQLAlchemy Models for AICTE Case Intelligence & Risk Assessment System
Problem Statement: SIH26264
"""

from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, ForeignKey, Float
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(String(50), primary_key=True)
    name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False) # ADMIN, BUREAU_OFFICER, REVIEWER, READONLY_MANAGEMENT
    bureau_id = Column(String(50), nullable=True)
    designation = Column(String(150), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Bureau(Base):
    __tablename__ = "bureaus"

    id = Column(String(50), primary_key=True)
    code = Column(String(20), unique=True, nullable=False)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    head_officer = Column(String(150), nullable=False)

class Institution(Base):
    __tablename__ = "institutions"

    id = Column(String(50), primary_key=True)
    permanent_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    state = Column(String(100), nullable=False)
    city = Column(String(100), nullable=False)
    address = Column(Text, nullable=False)
    institution_type = Column(String(100), nullable=False)
    established_year = Column(Integer, nullable=False)
    approved_intake = Column(Integer, default=0)
    risk_score = Column(Integer, default=0)
    risk_category = Column(String(50), default="LOW")
    has_active_conflict = Column(Boolean, default=False)
    naac_grade = Column(String(10), nullable=True)
    nba_accredited = Column(Boolean, default=False)

    cases = relationship("ComplaintCase", back_populates="institution")

class ComplaintCase(Base):
    __tablename__ = "complaint_cases"

    id = Column(String(50), primary_key=True)
    case_number = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    institution_id = Column(String(50), ForeignKey("institutions.id"), nullable=False)
    bureau_id = Column(String(50), ForeignKey("bureaus.id"), nullable=False)
    category = Column(String(100), nullable=False)
    submission_date = Column(DateTime, default=datetime.utcnow)
    source = Column(String(100), default="AICTE_PORTAL")
    complainant_type = Column(String(50), default="STUDENT")
    severity_level = Column(String(50), default="NORMAL") # CRITICAL, HIGH, NORMAL, TIME_SENSITIVE
    severity_score = Column(Integer, default=50)
    severity_reason = Column(Text, nullable=True)
    severity_rule_matched = Column(String(150), nullable=True)
    is_safety_urgent = Column(Boolean, default=False)
    status = Column(String(50), default="NEW")
    assigned_officer = Column(String(150), nullable=False)
    assigned_officer_email = Column(String(150), nullable=True)
    priority = Column(String(50), default="MEDIUM")
    deadline_date = Column(DateTime, nullable=False)
    next_action = Column(Text, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    institution = relationship("Institution", back_populates="cases")
    actions = relationship("CaseAction", back_populates="case", cascade="all, delete-orphan")

class CaseAction(Base):
    __tablename__ = "case_actions"

    id = Column(String(50), primary_key=True)
    case_id = Column(String(50), ForeignKey("complaint_cases.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    actor_name = Column(String(150), nullable=False)
    actor_role = Column(String(50), nullable=False)
    action_type = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    previous_value = Column(String(100), nullable=True)
    new_value = Column(String(100), nullable=True)

    case = relationship("ComplaintCase", back_populates="actions")

class CaseRelationship(Base):
    __tablename__ = "case_relationships"

    id = Column(String(50), primary_key=True)
    source_case_id = Column(String(50), ForeignKey("complaint_cases.id"), nullable=False)
    target_case_id = Column(String(50), ForeignKey("complaint_cases.id"), nullable=False)
    similarity_score = Column(Float, nullable=False)
    method = Column(String(100), default="HYBRID_TFIDF_SEMANTIC")
    status = Column(String(50), default="PENDING_REVIEW") # PENDING_REVIEW, CONFIRMED, REJECTED
    reviewed_by = Column(String(150), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    review_reason = Column(Text, nullable=True)

class CrossBureauConflict(Base):
    __tablename__ = "cross_bureau_conflicts"

    id = Column(String(50), primary_key=True)
    institution_id = Column(String(50), ForeignKey("institutions.id"), nullable=False)
    risk_level = Column(String(50), default="HIGH")
    conflict_type = Column(String(100), nullable=False)
    summary = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=False)
    status = Column(String(50), default="ACTIVE")
    detected_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    resolution_notes = Column(Text, nullable=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(50), primary_key=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    actor_id = Column(String(50), nullable=False)
    actor_name = Column(String(150), nullable=False)
    actor_role = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(String(50), nullable=False)
    entity_reference = Column(String(150), nullable=True)
    details = Column(Text, nullable=False)
    ip_address = Column(String(50), default="127.0.0.1")
