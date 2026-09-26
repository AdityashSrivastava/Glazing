from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class UserBase(BaseModel):
    id: UUID
    display_name: str
    avatar_url: Optional[str] = None
    total_lifetime_points: int = 0
    current_streak: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TaskBase(BaseModel):
    id: UUID
    user_id: UUID
    user_name: Optional[str] = None
    goal_id: Optional[UUID] = None
    goal_title: Optional[str] = None
    title: str
    is_private: bool = False
    estimated_hours: float = Field(..., gt=0)
    actual_hours: Optional[float] = Field(None, ge=0, le=24)
    status: str
    proof_url: Optional[str] = None
    points_earned: int = 0
    completed_at: Optional[datetime] = None
    active_bounties_count: int = 0
    total_bounty_points: int = 0
    bounty_issuers: List[str] = Field(default_factory=list)
    is_sniper: bool = False
    is_first_blood: bool = False
    tracked_timer_minutes: Optional[int] = 0
    tracked_timer_hours: Optional[float] = 0.0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class GoalBase(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    category: str
    status: str
    is_private: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class BountyBase(BaseModel):
    id: UUID
    issuer_id: UUID
    issuer_name: Optional[str] = None
    target_task_id: UUID
    target_task_title: Optional[str] = None
    target_user_id: Optional[UUID] = None
    target_user_name: Optional[str] = None
    points_at_stake: int
    status: str
    created_at: datetime
    resolved_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class DailySnapshotBase(BaseModel):
    id: UUID
    user_id: UUID
    snapshot_date: str
    points_earned_that_day: int
    tasks_completed_count: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Function to safely serialize tasks before returning to client
def mask_private_task(task: TaskBase, requesting_user_id: UUID) -> TaskBase:
    if task.is_private and task.user_id != requesting_user_id:
        task.title = "[ CLASSIFIED DATA ]"
        task.goal_id = None
        task.goal_title = None
        task.proof_url = None
    return task
