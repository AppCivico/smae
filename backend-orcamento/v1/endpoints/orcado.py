from fastapi import APIRouter, Depends, HTTPException

from requests.exceptions import HTTPError
from core.exceptions import EmptyData, UnexpectedResponse

from typing import Union

from core.dao import DaoOrcadoProjeto
from core.schemas.orcado_projeto import OrcadoProjeto as schm_orcado
from core.schemas.orcado_projeto import RetornoOrcado as schm_retorno

from core.schemas import MetaDados
from config import SOF_API_TOKEN

app = APIRouter()


def get_dao():

    dao = DaoOrcadoProjeto(auth_token=SOF_API_TOKEN)
    
    return dao

def build_response(dao, endpoint_name, **params):


    dao_func = getattr(dao, endpoint_name)
    try:
        result = dao_func(**params)
    except EmptyData as e:
        raise HTTPException(404, detail=str(e))
    except UnexpectedResponse as e:
        raise HTTPException(422, detail=str(e))
    except HTTPError as e:
        raise HTTPException(503, str(e))

    if result:
        resp_data = [schm_retorno(**item) for item in result]
        resp = schm_orcado(data=resp_data,
                    metadados=MetaDados(sucess=True))

        return resp
    
    raise HTTPException(404, detail=f"Nenhum item encontrado")

@app.get("/orcado_projeto", response_model=schm_orcado, tags=['Orcado'])
def orcado_projeto(ano:int, mes:int, orgao:int, proj_atividade: int,
                fonte: str, unidade: int=None, dao: DaoOrcadoProjeto = Depends(get_dao)):

   return build_response(dao, 'orcado_projeto', ano=ano, mes=mes, orgao=orgao,
                    unidade=unidade, proj_atividade=proj_atividade, fonte=fonte)