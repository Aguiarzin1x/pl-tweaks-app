"""Auth request/response models — mirror the TS interfaces in frontend/src/lib/types.ts."""

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    is_premium: bool
    # A guest is an auto-provisioned account (no password): the app treats it as "not
    # signed in" for UI purposes, so /login stays reachable and offers an upgrade path.
    is_guest: bool = False
