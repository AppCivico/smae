from pydantic import BaseModel, validator, ConfigDict
from typing import Literal, List, Optional

from .validators import (regex_numero_processo, regex_data_dia_mes_ano, 
                         regex_link_web, none_to_string)
from .basic import Unidade, Usuario


class Assunto(BaseModel):

    codigo : str
    descricao : str

class AndamentoSimples(BaseModel):

    unidade : Unidade
    usuario : Usuario


class AndamentoCompleto(AndamentoSimples):

    data : str
    descricao : str

    _data = validator('data',
                        allow_reuse=True, pre=True, always=True)(regex_data_dia_mes_ano)
   
class ReportUnidadeAberto(BaseModel):

    unidade : Unidade
    usuario_atribuido : Optional[Usuario]

class ResumoProcesso(BaseModel):

    numero_processo : str
    especificacao : str
    tipo : str
    data_autuacao : str
    link : str
    assuntos : List[Assunto]

    #validators

    _numero_processo = validator('numero_processo', 
                                   allow_reuse=True, pre=True, always=True)(regex_numero_processo)

    _data_autuacao = validator('data_autuacao',
                                allow_reuse=True, pre=True, always=True)(regex_data_dia_mes_ano)
    _link = validator('link',
                    allow_reuse=True, pre=True, always=True)(regex_link_web)
    
    _especificacao_vazia = validator('especificacao',
                               allow_reuse=True, pre=True, always=True)(none_to_string)
    

class RelatorioProcesso(ResumoProcesso):

    abertura : AndamentoSimples
    ultimo_andamento : AndamentoCompleto
    conclusao : Optional[AndamentoCompleto]
    unidades_aberto : List[ReportUnidadeAberto]