
from fastapi import HTTPException

class ProcessoNaoEncontrado(HTTPException):
    '''Raises quando o processo buscado não foi encontrado'''
    pass

