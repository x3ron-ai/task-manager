from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    CheckConstraint,
    Index,
)
from sqlalchemy.sql import func

from app.core.db import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(String, nullable=True)
    completed = Column(Boolean, default=False, nullable=False)
    importance = Column(Integer, default=1, nullable=False)
    due_date = Column(DateTime(timezone=True), nullable=True, server_default=func.now())

    __table_args__ = (
        CheckConstraint("importance BETWEEN 1 AND 5", name="importance_range"),
        Index("ix_task_completed", "completed"),
        Index("ix_task_importance", "importance"),
        Index("ix_task_due_date", "due_date"),
    )
