"""
Glazing Midterm Recess & Operations Freeze Configuration
Enforces academic standby protocol until November 6, 2026, 00:00:00 IST.
"""

from datetime import datetime, timezone, timedelta
from fastapi import HTTPException

# Strict Indian Standard Time offset (+05:30)
IST = timezone(timedelta(hours=5, minutes=30))

# Target Re-activation Moment: November 6, 2026, 00:00:00 IST
MIDTERM_RESUME_DATE = datetime(2026, 11, 6, 0, 0, 0, tzinfo=IST)

MIDTERM_SUSPENSION_MESSAGE = (
    "We're sorry, midterms are approaching and because of that Glazing "
    "has stopped validating any action whatsoever until 6 November 2026."
)

def is_midterm_freeze_active() -> bool:
    """Returns True if the current time in IST is prior to November 6, 2026 00:00:00 IST."""
    return datetime.now(IST) < MIDTERM_RESUME_DATE

def get_midterm_remaining_seconds() -> int:
    """Returns seconds remaining until midterm resume date."""
    now = datetime.now(IST)
    rem = (MIDTERM_RESUME_DATE - now).total_seconds()
    return max(0, int(rem))

def assert_midterm_operations_allowed():
    """Raises HTTP 403 Forbidden if Glazing operations are currently suspended for midterms."""
    if is_midterm_freeze_active():
        raise HTTPException(
            status_code=403,
            detail=MIDTERM_SUSPENSION_MESSAGE
        )
