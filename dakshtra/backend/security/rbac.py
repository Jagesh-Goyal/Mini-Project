from fastapi import Depends, HTTPException
from fastapi_jwt_auth import AuthJWT

from backend.models.role import RoleEnum


def require_roles(*roles: RoleEnum):
    def checker(authorize: AuthJWT = Depends()):
        authorize.jwt_required()
        role_value = authorize.get_raw_jwt().get("role")
        if role_value not in {r.value for r in roles}:
            raise HTTPException(status_code=403, detail="Insufficient role")
        return role_value

    return checker
