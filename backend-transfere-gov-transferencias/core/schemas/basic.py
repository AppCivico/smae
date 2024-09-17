from pydantic import BaseModel, field_validator
from typing import Literal, Optional, Union
from pandas import Timestamp
import pandas as pd
from datetime import datetime

MODALIDADES_PROGRAMA = Literal['CONVENIO', 'TERMO DE PARCERIA', 'TERMO DE COOPERACAO',
       'TERMO DE COLABORACAO', 'TERMO DE FOMENTO', 'CONTRATO DE REPASSE',
       'TERMO DE COMPROMISSO', 'CONVENIO OU CONTRATO DE REPASSE']

NATUREZAS_JURIDICAS_PROGRAMA = Literal['Organização da Sociedade Civil',
       'Administração Pública Estadual ou do Distrito Federal',
       'Administração Pública Municipal',
       'Empresa pública/Sociedade de economia mista',
       'Administração Pública Federal', 'Consórcio Público',
       'Natureza Jurídica a Classificar']

UFS = Literal['SC', 'RN', 'AC', 'AL', 'MA', 'CE', 'PI', 'SP', 'PE', 'PB', 'MG',
       'MT', 'DF', 'BA', 'RO', 'PR', 'GO', 'SE', 'RS', 'AP', 'AM', 'RJ',
       'MS', 'RR', 'PA', 'TO', 'ES']

class Transferencia(BaseModel):

    cod_orgao_sup_programa: int
    desc_orgao_sup_programa: str
    cod_programa: int
    id_programa: int
    nome_programa: str
    sit_programa: Literal['DISPONIBILIZADO', 'INATIVO', 'CADASTRADO']
    data_disponibilizacao: str
    ano_disponibilizacao: int
    dt_ini_receb: str
    dt_fim_receb: Optional[str]
    modalidade_programa: Optional[MODALIDADES_PROGRAMA]
    acao_orcamentaria: str
    natureza_juridica_programa: Optional[NATUREZAS_JURIDICAS_PROGRAMA]
    uf_programa: Optional[UFS]


    @field_validator('ano_disponibilizacao', mode='before')
    @classmethod
    def ano_to_int(cls, v: float) -> int:

        return int(v)
    
    @field_validator('dt_ini_receb', mode='before')
    @classmethod
    def dtime_to_str(cls, v: Timestamp) -> int:

        return v.strftime('%d/%m/%Y')
    
    @field_validator('dt_fim_receb', mode='before')
    @classmethod
    def dtime_to_str_optional(cls, v: Union[Timestamp, None]) -> int:

        if pd.isnull(v):
            return None

        return v.strftime('%d/%m/%Y')
    
    @field_validator('modalidade_programa', mode='before')
    @classmethod
    def nan_to_none(cls, v: Union[str, None]) -> int:

        if pd.isnull(v):
            return None

        return v
    
    @field_validator('uf_programa', mode='before')
    @classmethod
    def uf(cls, v: Union[str, None]) -> int:

        if pd.isnull(v):
            return None
        
        v = str(v)
        v = v.upper()

        return v

class DataAtualizacao(BaseModel):

    ultima_atualizacao: str

    @field_validator('ultima_atualizacao', mode='before')
    @classmethod
    def datetime_to_str(cls, v: Union[str, None]) -> int:

        format = r'%d/%m/%Y %H:%M:%S'

        return v.strftime(format)


    
