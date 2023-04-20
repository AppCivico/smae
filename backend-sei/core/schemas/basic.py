from pydantic import BaseModel, validator
from typing import Literal

from .validators import s_n_to_bool

class Unidade(BaseModel):

    id_unidade : str
    sigla : str
    descricao : str
    sin_protocolo : bool
    sin_arquivamento : bool
    sin_ouvidoria : bool

    #validators

    _protocolo_to_bool = validator('sin_protocolo', 
                                   allow_reuse=True, pre=True, always=True)(s_n_to_bool)
    _arquivamento_to_bool = validator('sin_arquivamento', 
                                      allow_reuse=True, pre=True, always=True)(s_n_to_bool)
    _ouvidoria_to_bool = validator('sin_ouvidoria', 
                                   allow_reuse=True, pre=True, always=True)(s_n_to_bool)
    
class TipoProcesso(BaseModel):

    id_tipo_procedimento : str
    nome : str

class TipoDocumento(BaseModel):

    id_serie : str
    nome : str
    aplicabilidade : Literal[
                            'internos_e_externos',
                            'internos',
                            'externos',
                            'formularios'
                        ]

    @validator('aplicabilidade', pre=True, always=True)
    def padronizar_aplicabilidade(cls, value, values)->str:

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
            raise ValueError(f'Valor fora do padrão: {val}. Opções: {mapper}')
        

class HipoteseLegal(BaseModel):

    id_hipotese_legal : str
    nome : str
    base_legal : str
    nivel_acesso : str








