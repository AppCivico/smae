from pydantic import BaseModel, validator
from typing import Literal, Optional
from core.exceptions.basic import DadosForaDoPadrao
from .validators import regex_link_web

class Link(BaseModel):

    link : str

    #validators
    _link_processo = validator('link',
                               allow_reuse=True, pre=True, always=True)(regex_link_web)

class Unidade(BaseModel):

    id_unidade : str
    sigla : str
    descricao : str
    tipo_unidade : Literal[
                            'protocolo',
                            'arquivo',
                            'ouvidoria',
                            'regular'
                        ]
    
class Usuario(BaseModel):

    id : Optional[str] #pois eh, aparentemente ha usuarios com id null...
    nome : str
    rf : str
    
class TipoProcesso(BaseModel):

    id_tipo_procedimento : str
    nome : str

class TipoDocumento(BaseModel):

    id : str
    aplicabilidade : Literal[
                            'internos_e_externos',
                            'internos',
                            'externos',
                            'formularios',
                            'nao_informado'
                        ]
    tipo : str

    @validator('aplicabilidade', pre=True, always=True)
    def padronizar_aplicabilidade(cls, value, values)->str:

        if value is None:
            return 'nao_informado'

        val = str(value).lower().strip()

        mapper = {
            't' : 'internos_e_externos',
            'i' : 'internos',
            'e' : 'externos',
            'f' : 'formularios'
        }

        aceitos = {
                    'internos_e_externos',
                    'internos',
                    'externos',
                    'formularios'
                    }

        #tem que checar para ver se já está construindo com o objeto correto
        if value in aceitos:
            return value

        try:
            return mapper[val]
        except KeyError:
            raise DadosForaDoPadrao(500, f'Valor para aplicabilidade do doc. fora do padrão: {val}. Opções: {mapper}')








