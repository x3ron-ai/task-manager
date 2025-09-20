from pydantic import BaseModel


class MsgResponse(BaseModel):
    msg: str
