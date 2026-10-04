import sys
from app.routers.tasks import analyze_proof_of_work

def test_proof_analysis():
    print("Testing analyze_proof_of_work...")
    
    # Test 1: Image screenshot from supabase storage
    valid, msg = analyze_proof_of_work(
        "Build auth router",
        "Development",
        "https://xyz.supabase.co/storage/v1/object/public/proof_uploads/user123_proof.png"
    )
    assert valid is True, f"Expected True for screenshot, got {valid}: {msg}"
    print("  [PASS] Screenshot verified:", msg)

    # Test 2: GitHub PR for Development
    valid, msg = analyze_proof_of_work(
        "Implement login screen and styling",
        "Development",
        "https://github.com/myorg/glazing/pull/42"
    )
    assert valid is True, f"Expected True for GitHub PR, got {valid}: {msg}"
    print("  [PASS] GitHub PR verified:", msg)

    # Test 3: LeetCode submission for DSA
    valid, msg = analyze_proof_of_work(
        "Solve 3Sum and Two Pointer problems",
        "DSA",
        "https://leetcode.com/submissions/detail/123456789/"
    )
    assert valid is True, f"Expected True for LeetCode, got {valid}: {msg}"
    print("  [PASS] LeetCode submission verified:", msg)

    # Test 4: Irrelevant or empty proof
    valid, msg = analyze_proof_of_work(
        "Solve DP problems",
        "DSA",
        ""
    )
    assert valid is False
    print("  [PASS] Empty proof rejected:", msg)

    # Test 5: Irrelevant random URL
    valid, msg = analyze_proof_of_work(
        "Implement backend api",
        "Development",
        "https://www.netflix.com/browse"
    )
    assert valid is False
    print("  [PASS] Irrelevant URL rejected:", msg)

def test_points_math():
    print("Testing points math...")
    # DSA: 2 hrs * 15 = 30 pts + 5 proof = 35 pts
    # Development: 2 hrs * 12.5 = 25 pts + 5 proof = 30 pts
    # College Work: 2 hrs * 10 = 20 pts + 5 proof = 25 pts
    # Base: 2 hrs * 5 = 10 pts + 5 proof = 15 pts
    from app.routers.tasks import DOMAIN_HOURLY_RATES
    assert DOMAIN_HOURLY_RATES["DSA"] == 15.0
    assert DOMAIN_HOURLY_RATES["Development"] == 12.5
    assert DOMAIN_HOURLY_RATES["College Work"] == 10.0
    assert DOMAIN_HOURLY_RATES["College Studies"] == 10.0
    print("  [PASS] Domain hourly rates verified:", DOMAIN_HOURLY_RATES)

def test_gym_router():
    print("Testing gym router...")
    from fastapi.testclient import TestClient
    from app.main import app
    from app.auth import get_current_user

    client = TestClient(app)
    # Mock current user
    app.dependency_overrides[get_current_user] = lambda: "b0bd077c-a4f6-49a0-b5ee-06e1cc8429ea"
    
    res = client.get("/api/gym/status")
    print("  [PASS] GET /api/gym/status response:", res.status_code, res.json())
    assert res.status_code == 200
    data = res.json()
    assert "checked_today" in data
    assert "streak_days" in data
    assert "points_awarded" in data
    assert data["points_awarded"] == 5

def test_weekly_achievers():
    print("Testing weekly achievers endpoint...")
    from fastapi.testclient import TestClient
    from app.main import app
    from app.auth import get_current_user

    client = TestClient(app)
    app.dependency_overrides[get_current_user] = lambda: "b0bd077c-a4f6-49a0-b5ee-06e1cc8429ea"
    
    res = client.get("/api/users/weekly-achievers")
    print("  [PASS] GET /api/users/weekly-achievers response status:", res.status_code)
    assert res.status_code == 200
    data = res.json()
    assert "current_week_id" in data
    assert "latest_completed_week" in data
    lw = data.get("latest_completed_week")
    assert lw is not None
    assert "winner" in lw
    assert "party_sponsors" in lw
    print(f"  [PASS] Winner: {lw['winner']['display_name']} with {lw['winner']['points']} pts")
    print(f"  [PASS] Party Sponsors (ranks 4 & 5): {lw['party_sponsors']}")

if __name__ == "__main__":
    test_proof_analysis()
    test_points_math()
    test_gym_router()
    test_weekly_achievers()
    print("\nALL RULE TESTS PASSED SUCCESSFULLY!")
