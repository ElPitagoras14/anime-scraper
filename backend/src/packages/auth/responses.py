from pydantic import BaseModel

from utils.responses import SuccessResponse


class Token(BaseModel):
    token: str
    type: str


class TokenOut(SuccessResponse):
    payload: Token | None
