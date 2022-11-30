from fastapi import APIRouter, Depends, HTTPException
from typing import List

from requests.exceptions import HTTPError
from core.exceptions import EmptyData, UnexpectedResponse

from core.dao import DaoEmpenhos
from core.schemas import empenhos as schm_empenho
from core.schemas import MetaDados
from config import SOF_API_TOKEN

app = APIRouter()


def get_dao():

    dao = DaoEmpenhos(auth_token=SOF_API_TOKEN)
    
    return dao


@app.post("/nota_empenho", response_model=schm_empenho.Empenhos, tags=['Empenhos'])
def empenho_nota(nota_empenho:schm_empenho.NotaEmpenho, dao: DaoEmpenhos = Depends(get_dao)):

    ano = nota_empenho.ano
    mes = nota_empenho.mes
    nota_empenho = nota_empenho.nota_empenho
    
    try:
        result = dao.nota_empenho(ano=ano, mes=mes, nota_empenho=nota_empenho)
    except EmptyData as e:
        raise HTTPException(404, detail=str(e))
    except UnexpectedResponse as e:
        raise HTTPException(422, detail=str(e))
    except HTTPError as e:
        raise HTTPException(503, str(e))

    if result:
        resp_data = [schm_empenho.RetornoEmpenho(**item) for item in result]
        resp = schm_empenho.Empenhos(data=resp_data,
                    metadados=MetaDados(sucess=True))

        return resp
    
    raise HTTPException(404, detail=f"Nenhum empenho encontrado")

@app.post("/processo", response_model=schm_empenho.Empenhos, tags=['Empenhos'])
def empenho_proc(processo:schm_empenho.Processo, dao: DaoEmpenhos = Depends(get_dao)):

    ano = processo.ano
    mes = processo.mes
    processo = processo.processo
    try:
        result = dao.processo(ano=ano, mes=mes, processo=processo)
    except EmptyData as e:
        raise HTTPException(404, detail=str(e))
    except UnexpectedResponse as e:
        raise HTTPException(422, detail=str(e))
    except HTTPError as e:
        raise HTTPException(503, str(e))

    if result:
        resp_data = [schm_empenho.RetornoEmpenho(**item) for item in result]
        resp = schm_empenho.Empenhos(data=resp_data,
                    metadados=MetaDados(sucess=True))

        return resp
    
    raise HTTPException(404, detail=f"Nenhum empenho encontrado")

@app.post("/dotacao", response_model=schm_empenho.Empenhos, tags=['Empenhos'])
def empenho_dotacao(dotacao:schm_empenho.Dotacao, dao: DaoEmpenhos = Depends(get_dao)):

    ano = dotacao.ano
    mes = dotacao.mes
    dotacao = dotacao.dotacao

    try:
        result = dao.dotacao(ano=ano, mes=mes, dotacao=dotacao)
    except EmptyData as e:
        raise HTTPException(404, detail=str(e))
    except UnexpectedResponse as e:
        raise HTTPException(422, detail=str(e))
    except HTTPError as e:
        raise HTTPException(503, str(e))

    if result:
        resp_data = [schm_empenho.RetornoEmpenho(**item) for item in result]
        resp = schm_empenho.Empenhos(data=resp_data,
                    metadados=MetaDados(sucess=True))

        return resp

    raise HTTPException(404, detail=f"Nenhum empenho encontrado")

    