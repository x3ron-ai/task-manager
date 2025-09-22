from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional

from app.core.db import AsyncSessionLocal
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskRead, TaskUpdate
from app.core.utils import normalize_datetime


router = APIRouter()


async def get_db():
    """Yield an asynchronous database session."""
    async with AsyncSessionLocal() as db:
        yield db


async def get_task_or_404(db: AsyncSession, task_id: int) -> Task:
    """Retrieve a task by ID or raise a 404 error if not found."""
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.get("/", response_model=List[TaskRead])
async def get_tasks(
    db: AsyncSession = Depends(get_db),
    completed: Optional[bool] = None,
    importance: Optional[int] = None,
):
    """Retrieve a list of tasks, optionally filtered by completion status and importance."""
    stmt = select(Task)
    if completed is not None:
        stmt = stmt.where(Task.completed == completed)

    if importance is not None:
        stmt = stmt.where(Task.importance == importance)

    result = await db.execute(stmt)
    tasks = result.scalars().all()
    return tasks


@router.get("/{task_id}", response_model=TaskRead)
async def get_task(task_id: int, db: AsyncSession = Depends(get_db)):
    """Retrieve a single task by ID."""
    task = await get_task_or_404(db, task_id)
    return task


@router.post("/", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
async def add_task(task_in: TaskCreate, db: AsyncSession = Depends(get_db)):
    """Create a new task."""
    task = Task(
        title=task_in.title,
        description=task_in.description,
        importance=task_in.importance,
        due_date=normalize_datetime(task_in.due_date),
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


@router.patch("/{task_id}", response_model=TaskRead)
async def update_task(
    task_id: int, task_in: TaskUpdate, db: AsyncSession = Depends(get_db)
):
    """Update an existing task."""
    task = await get_task_or_404(db, task_id)
    if task_in.title is not None:
        task.title = task_in.title
    if task_in.description is not None:
        task.description = task_in.description
    if task_in.completed is not None:
        task.completed = task_in.completed
    if task_in.importance is not None:
        task.importance = task_in.importance
    if task_in.due_date is not None:
        task.due_date = normalize_datetime(task_in.due_date)
    await db.commit()
    await db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a task by ID."""
    task = await get_task_or_404(db, task_id)
    await db.delete(task)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
