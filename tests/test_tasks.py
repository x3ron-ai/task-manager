import pytest
from fastapi.testclient import TestClient
from app.main import app

def test_ping():
    with TestClient(app) as client:
        resp = client.get("/ping")
    assert resp.status_code == 200
    assert resp.json() == {"msg": "pong"}

def test_create_and_get_task():
    with TestClient(app) as client:
        # Create task
        data = {
            "title": "Test task",
            "description": "Test desc",
            "importance": 3
        }
        resp = client.post("/api/tasks/", json=data)
        assert resp.status_code == 201
        task = resp.json()
        assert task["title"] == data["title"]
        assert task["importance"] == data["importance"]

        # Get task
        resp = client.get(f"/api/tasks/{task['id']}")
        assert resp.status_code == 200
        got = resp.json()
        assert got["id"] == task["id"]

def test_update_and_delete_task():
    with TestClient(app) as client:
        # Create task
        data = {"title": "To update", "importance": 2}
        resp = client.post("/api/tasks/", json=data)
        task = resp.json()
        tid = task["id"]

        # Update task
        upd = {"title": "Updated", "completed": True}
        resp = client.patch(f"/api/tasks/{tid}", json=upd)
        assert resp.status_code == 200
        updated = resp.json()
        assert updated["title"] == "Updated"
        assert updated["completed"] is True

        # Delete task
        resp = client.delete(f"/api/tasks/{tid}")
        assert resp.status_code == 204

        # Check deleted
        resp = client.get(f"/api/tasks/{tid}")
        assert resp.status_code == 404
