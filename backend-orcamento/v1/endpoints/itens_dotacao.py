from fastapi import APIRouter, Depends, HTTPException

from requests.exceptions import HTTPError
from core.exceptions import EmptyData, UnexpectedResponse

from core.dao import DaoItensDotacao
from core.schemas import itens_dotacao as schm_dotacao
from core.schemas import MetaDados
from config import SOF_API_TOKEN

app = APIRouter()


def get_dao():

    dao = DaoItensDotacao(auth_token=SOF_API_TOKEN)
    
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
        resp_data = [schm_dotacao.ItemBasico(**item) for item in result]
        resp = schm_dotacao.ResultItem(data=resp_data,
                    metadados=MetaDados(sucess=True))

        return resp
    
    raise HTTPException(404, detail=f"Nenhum item encontrado")


@app.get("/orgaos", response_model=schm_dotacao.ResultItem, tags=['Dotacao'])
def orgaos(ano: str, dao: DaoItensDotacao = Depends(get_dao)):

   return build_response(dao, 'orgaos', ano=ano)


@app.get("/unidades", response_model=schm_dotacao.ResultItem, tags=['Dotacao'])
def unidades(ano: str, cod_orgao: str, dao: DaoItensDotacao = Depends(get_dao)):

   return build_response(dao, 'unidades', ano=ano, cod_orgao=cod_orgao)

@app.get("/funcoes", response_model=schm_dotacao.ResultItem, tags=['Dotacao'])
def funcoes(ano: str, dao: DaoItensDotacao = Depends(get_dao)):

   return build_response(dao, 'funcoes', ano=ano)

@app.get("/subfuncoes", response_model=schm_dotacao.ResultItem, tags=['Dotacao'])
def subfuncoes(ano: str, dao: DaoItensDotacao = Depends(get_dao)):

   return build_response(dao, 'subfuncoes', ano=ano)

@app.get("/programas", response_model=schm_dotacao.ResultItem, tags=['Dotacao'])
def programas(ano: str, dao: DaoItensDotacao = Depends(get_dao)):

   return build_response(dao, 'programas', ano=ano)

@app.get("/projetos_atividades", response_model=schm_dotacao.ResultItem, tags=['Dotacao'])
def projetos_atividades(ano: str, dao: DaoItensDotacao = Depends(get_dao)):

   return build_response(dao, 'projetos_atividades', ano=ano)

@app.get("/categorias", response_model=schm_dotacao.ResultItem, tags=['Dotacao'])
def categorias(ano: str, dao: DaoItensDotacao = Depends(get_dao)):

   return build_response(dao, 'categorias', ano=ano)

@app.get("/grupos", response_model=schm_dotacao.ResultItem, tags=['Dotacao'])
def grupos(ano: str, dao: DaoItensDotacao = Depends(get_dao)):

   return build_response(dao, 'grupos', ano=ano)

@app.get("/modalidades", response_model=schm_dotacao.ResultItem, tags=['Dotacao'])
def modalidades(ano: str, dao: DaoItensDotacao = Depends(get_dao)):

   return build_response(dao, 'modalidades', ano=ano)

@app.get("/elementos", response_model=schm_dotacao.ResultItem, tags=['Dotacao'])
def elementos(ano: str, dao: DaoItensDotacao = Depends(get_dao)):

   return build_response(dao, 'elementos', ano=ano)

@app.get("/fonte_recursos", response_model=schm_dotacao.ResultItem, tags=['Dotacao'])
def fonte_recursos(ano: str, dao: DaoItensDotacao = Depends(get_dao)):

   return build_response(dao, 'fonte_recursos', ano=ano)


@app.get("/all_items", response_model=schm_dotacao.AllItems, tags=['Dotacao'])
def fonte_recursos(ano: str, dao: DaoItensDotacao = Depends(get_dao)):

    resp = dao(ano=ano)

    resp['metadados'] = MetaDados(sucess=True)

    try:

        return schm_dotacao.AllItems(**resp)
    
    except EmptyData as e:
        raise HTTPException(404, detail=str(e))
    except UnexpectedResponse as e:
        raise HTTPException(422, detail=str(e))
    except HTTPError as e:
        raise HTTPException(503, str(e))