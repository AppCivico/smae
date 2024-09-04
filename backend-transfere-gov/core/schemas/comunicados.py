from pydantic import BaseModel, HttpUrl, field_validator
from datetime import datetime
import re
from typing import List

from ..exceptions import DadosForadoPadrao

class Comunicado(BaseModel):

    numero: int
    ano: int
    titulo: str
    link: HttpUrl
    data: str
    descricao: str

    @field_validator('data')
    def validate_data(cls, value: str) -> str:
        try:
            # First, try to parse with both date and time
            datetime.strptime(value, '%d/%m/%Y %H:%M:%S')
        except ValueError:
            try:
                # If that fails, try to parse with just the date
                datetime.strptime(value, '%d/%m/%Y')
            except ValueError:
                raise DadosForadoPadrao(f'data: {value} - formato inválido. Use DD/MM/YYYY ou DD/MM/YYYY HH:MM:SS')
        return value

class Page(BaseModel):

    ultima_atualizacao: str
    comunicados: List[Comunicado]

    @field_validator('ultima_atualizacao')
    def validate_datetime(cls, value)->str:

        date_pattern = r'(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])/\d{4}'
        hour_pattern = r'(0[0-9]|1[0-9]|2[0-3])h([0-5][0-9])'

        full_pattern = '^' + date_pattern + r' ' + hour_pattern + '$'

        teste = re.search(full_pattern, value)

        if teste is None:
            raise DadosForadoPadrao('ultima_atualizacao: {value}')

        return value

