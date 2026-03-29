from fastapi import Depends
from fastapi_jwt_auth import AuthJWT


def jwt_required(authorize: AuthJWT = Depends()):
    authorize.jwt_required()
    return authorize.get_jwt_subject()
