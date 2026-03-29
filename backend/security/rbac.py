from collections.abc import Callable

from fastapi import Depends, HTTPException, status
from fastapi_jwt_auth import AuthJWT

from backend.models.user import UserRole


def require_roles(*roles: UserRole) -> Callable:
    def dependency(authorize: AuthJWT = Depends()):
        authorize.jwt_required()
        role_value = authorize.get_raw_jwt().get("role")
        if role_value not in {role.value for role in roles}:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")
        return role_value

    return dependency
