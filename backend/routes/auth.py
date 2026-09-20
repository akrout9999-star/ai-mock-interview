from fastapi import APIRouter, HTTPException, status

from database import get_connection
from models.auth import RegisterRequest, LoginRequest, TokenResponse
from services.auth_service import (
    hash_password,
    verify_password,
    create_access_token
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse)
def register(data: RegisterRequest):
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT id FROM users WHERE email = %s",
                (data.email,)
            )

            if cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Email already registered"
                )

            password_hash = hash_password(data.password)

            cursor.execute(
                """
                INSERT INTO users (name, email, password_hash)
                VALUES (%s, %s, %s)
                RETURNING id
                """,
                (data.name, data.email, password_hash)
            )

            user = cursor.fetchone()
            conn.commit()

    token = create_access_token(user["id"], data.email)

    return {
        "access_token": token,
        "token_type": "bearer"
    }


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest):
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, email, password_hash
                FROM users
                WHERE email = %s
                """,
                (data.email,)
            )

            user = cursor.fetchone()

    if not user or not verify_password(
        data.password,
        user["password_hash"]
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    token = create_access_token(user["id"], user["email"])

    return {
        "access_token": token,
        "token_type": "bearer"
    }