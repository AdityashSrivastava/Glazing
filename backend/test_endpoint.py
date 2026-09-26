from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# We can mock the auth dependency
from app.auth import get_current_user
app.dependency_overrides[get_current_user] = lambda: "b0bd077c-a4f6-49a0-b5ee-06e1cc8429ea" # fake user ID

response = client.get("/api/bounties")
print("GET /bounties status:", response.status_code)
print("GET /bounties body:", response.json())
