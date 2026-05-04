from typing import Optional
from pydantic import BaseModel

class OAuthCallback(BaseModel):
    code: str
    state: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str
