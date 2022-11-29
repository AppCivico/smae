from pydantic import BaseModel
from typing import Optional

class MetaDados(BaseModel):

    sucess: bool
    message: Optional[str]