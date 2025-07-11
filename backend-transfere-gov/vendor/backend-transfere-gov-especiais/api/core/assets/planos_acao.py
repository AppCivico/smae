from core.utils.cache import cache_property

from core.extract import list_planos_acao
from core.transform import get_status_planos_acao
from core.transform import injetar_detalhes_plano_acao

@cache_property('all_planos_acao')
def all_planos_acao()->list[dict]:
    """
    Fetch all action plans.
    """
    planos = list_planos_acao(all=True)
    return planos['listaPlanosAcao']

@cache_property('planos_acao_benficiario_default')
def planos_acao_beneficiario_default() -> list[dict]:
    """
    Fetch action plans for a specific beneficiary.
    """
    planos = list_planos_acao(all=False)
    return planos['listaPlanosAcao']

def planos_acao_beneficiario(id_beneficiario:str) -> list[dict]:
    """
    Fetch action plans for a specific beneficiary. Can't cache this.
    """
    planos = list_planos_acao(id_beneficiario=id_beneficiario, all=False)
    return planos['listaPlanosAcao']

@cache_property('status_planos_acao')
def status_planos_acao_all() -> dict:
    """
    Get the status of all action plans.
    """
    planos = all_planos_acao()
    return get_status_planos_acao(planos)

@cache_property('status_planos_acao_beneficiario_default')
def status_planos_acao_beneficiario_default() -> dict:
    """
    Get the status of action plans for a specific beneficiary.
    """
    planos = planos_acao_beneficiario_default()
    return get_status_planos_acao(planos)

def status_plano_acao_beneficiario(id_beneficiario:str) -> dict:
    """
    Get the status of action plans for a specific beneficiary.
    """
    planos = list_planos_acao(id_beneficiario=id_beneficiario, all=False)
    return get_status_planos_acao(planos['listaPlanosAcao'])

def planos_acao_detailed(skip:int, limit:int) -> tuple[int, list[dict]]:
    """
    Fetch detailed information about action plans.
    """
    planos = all_planos_acao()
    if limit < 0:
        raise ValueError("Limit must be a non-negative integer.")
    if skip < 0:
        raise ValueError("Skip must be a non-negative integer.")
    if skip >= len(planos):
        return 0, []
    if skip + limit > len(planos):
        limit = len(planos) - skip
    if limit == 0:
        return 0, []
    
    planos_paginated = planos[skip:skip+limit]
    total_count = len(planos)
    data = [injetar_detalhes_plano_acao(plano) for plano in planos_paginated]
    return total_count, data

def planos_acao_detailed_beneficiario(id_beneficiario:str, skip:int, limit:int) -> tuple[int, list[dict]]:
    """
    Fetch detailed information about action plans for a specific beneficiary.
    """
    planos = planos_acao_beneficiario(id_beneficiario)
    if limit < 0:
        raise ValueError("Limit must be a non-negative integer.")
    if skip < 0:
        raise ValueError("Skip must be a non-negative integer.")
    if skip >= len(planos):
        return 0, []
    if skip + limit > len(planos):
        limit = len(planos) - skip
    if limit == 0:
        return 0, []
    
    planos_paginated = planos[skip:skip+limit]
    total_count = len(planos)
    data = [injetar_detalhes_plano_acao(plano) for plano in planos_paginated]
    return total_count, data

@cache_property('planos_acao_detailed_beneficiario_default')
def planos_acao_detailed_beneficiario_default()->tuple[int, list[dict]]:
    """
    Fetch detailed information about action plans for default beneficiary.
    """
    
    planos = planos_acao_beneficiario_default()
    data = [injetar_detalhes_plano_acao(plano) for plano in planos]
    total_count = len(planos)
    return total_count, data