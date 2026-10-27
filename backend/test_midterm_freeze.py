from fastapi.testclient import TestClient
from app.main import app
from app.midterm import is_midterm_freeze_active, MIDTERM_RESUME_DATE, MIDTERM_SUSPENSION_MESSAGE
from app.auth import get_current_user

# Mock auth dependency
app.dependency_overrides[get_current_user] = lambda: "a0000000-0000-0000-0000-000000000001"

client = TestClient(app)

def test_midterm_status_endpoint():
    res = client.get("/api/midterm-status")
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["active"] is True
    assert "2026-11-06" in data["resume_date"]
    assert data["seconds_remaining"] > 0
    print("[PASS] GET /api/midterm-status verified:", data)

def test_task_creation_blocked():
    res = client.post("/api/tasks", json={
        "title": "Solve 3 LeetCode DP Problems",
        "estimated_hours": 2.0,
        "is_private": False
    })
    assert res.status_code == 403, f"Expected 403, got {res.status_code}: {res.text}"
    detail = res.json()["detail"]
    assert "midterms are approaching" in detail.lower()
    print("[PASS] POST /api/tasks blocked with 403:", detail)

def test_task_complete_blocked():
    res = client.patch("/api/tasks/a0000000-0000-0000-0000-000000000001/complete", json={
        "actual_hours": 2.0,
        "proof_url": "https://github.com/pull/1"
    })
    assert res.status_code == 403, f"Expected 403, got {res.status_code}: {res.text}"
    detail = res.json()["detail"]
    assert "midterms are approaching" in detail.lower()
    print("[PASS] PATCH /api/tasks/{id}/complete blocked with 403:", detail)

def test_gym_checkin_blocked():
    res = client.post("/api/gym/checkin")
    assert res.status_code == 403, f"Expected 403, got {res.status_code}: {res.text}"
    detail = res.json()["detail"]
    assert "midterms are approaching" in detail.lower()
    print("[PASS] POST /api/gym/checkin blocked with 403:", detail)

def test_bounty_creation_blocked():
    res = client.post("/api/bounties", json={
        "target_task_id": "a0000000-0000-0000-0000-000000000001",
        "points_at_stake": 50
    })
    assert res.status_code == 403, f"Expected 403, got {res.status_code}: {res.text}"
    detail = res.json()["detail"]
    assert "midterms are approaching" in detail.lower()
    print("[PASS] POST /api/bounties blocked with 403:", detail)

if __name__ == "__main__":
    test_midterm_status_endpoint()
    test_task_creation_blocked()
    test_task_complete_blocked()
    test_gym_checkin_blocked()
    test_bounty_creation_blocked()
    print("\nALL MIDTERM FREEZE DEFENSE TESTS PASSED!")
