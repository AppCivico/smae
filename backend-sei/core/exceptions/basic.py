from fastapi import HTTPException

class DadosForaDoPadrao(HTTPException):
    '''Raises quando os dados retornados estão fora do padrão'''