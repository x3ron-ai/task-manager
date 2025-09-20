from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    importance: int = Field(1, ge=1, le=5)
    due_date: Optional[datetime] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    completed: Optional[bool] = None
    importance: Optional[int] = Field(None, ge=1, le=5)
    due_date: Optional[datetime] = None


class TaskRead(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    completed: bool
    importance: int
    due_date: Optional[datetime] = None

    model_config = {"from_attributes": True}
