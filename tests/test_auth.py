import pytest
from httpx import AsyncClient

from tests.conftest import make_user, unique_email


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    resp = await client.post("/auth/register", json={
        "email": unique_email(),
        "username": "newuser",
        "surname": "testsurname",
        "password": "password123",
        "phone": "+70000000001",
        "role": "passenger",
    })
    assert resp.status_code == 200
    assert "message" in resp.json()


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    email = unique_email()
    payload = {
        "email": email,
        "username": "dupuser",
        "surname": "testsurname",
        "password": "password123",
        "phone": "+70000000002",
    }
    await client.post("/auth/register", json=payload)
    resp = await client.post("/auth/register", json=payload)
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_register_admin_role_forbidden(client: AsyncClient):
    resp = await client.post("/auth/register", json={
        "email": unique_email(),
        "username": "hacker",
        "surname": "testsurname",
        "password": "password123",
        "phone": "+70000000003",
        "role": "admin",
    })
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_login_unverified_user(client: AsyncClient, db):
    user, _ = await make_user(db, verified=False)
    resp = await client.post("/auth/login", json={
        "email": user.email,
        "password": "password123",
    })
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, db):
    user, _ = await make_user(db)
    resp = await client.post("/auth/login", json={
        "email": user.email,
        "password": "password123",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient, db):
    user, _ = await make_user(db)
    resp = await client.post("/auth/login", json={
        "email": user.email,
        "password": "wrongpassword",
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_login_unknown_email(client: AsyncClient):
    resp = await client.post("/auth/login", json={
        "email": "nobody@nowhere.com",
        "password": "password123",
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_get_me(client: AsyncClient, db):
    user, token = await make_user(db)
    resp = await client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["email"] == user.email


@pytest.mark.asyncio
async def test_get_me_no_token(client: AsyncClient):
    resp = await client.get("/auth/me")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_logout(client: AsyncClient, db):
    _, token = await make_user(db)
    resp = await client.post(
        "/auth/logout",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient, db):
    user, _ = await make_user(db)

    login_resp = await client.post("/auth/login", json={
        "email": user.email,
        "password": "password123",
    })
    refresh_token = login_resp.json()["refresh_token"]

    resp = await client.post(
        "/auth/refresh",
        headers={"Authorization": f"Bearer {refresh_token}"},
    )
    assert resp.status_code == 200
    assert "access_token" in resp.json()


@pytest.mark.asyncio
async def test_password_reset_invalid_token(client: AsyncClient):
    resp = await client.post("/auth/password-reset-confirm/invalidtoken", json={
        "new_password": "newpassword123",
        "confirm_new_password": "newpassword123",
    })
    assert resp.status_code in (400, 401)


@pytest.mark.asyncio
async def test_password_reset_passwords_mismatch(client: AsyncClient, db):
    from src.auth.utils import create_url_safe_token
    user, _ = await make_user(db)
    token = create_url_safe_token({"email": user.email})

    resp = await client.post(f"/auth/password-reset-confirm/{token}", json={
        "new_password": "newpassword123",
        "confirm_new_password": "differentpassword",
    })
    assert resp.status_code == 400
