from fastapi import APIRouter, Query, HTTPException

from typing import List, Optional

from config import ID_BENEFICIARIO

from core.assets.planos_acao import (
                        all_planos_acao,
                        planos_acao_beneficiario,
                        planos_acao_beneficiario_default,
                        status_planos_acao_all,
                        status_plano_acao_beneficiario,
                        status_planos_acao_beneficiario_default,
                        planos_acao_detailed,
                        planos_acao_detailed_beneficiario,
                        planos_acao_detailed_beneficiario_default
                    )
from core.schemas.plano_acao import PlanoAcaoBase, PlanoAcaoDetailed
from core.schemas.page import PlanoBasePage, PlanoDetailedPage
from core.schemas.status_counts import StatusCount
from core.parsers import parse_plano_acao_basico, parse_plano_acao_detailed, parse_status_counts

app = APIRouter()

@app.get('/planos-acao', tags=["Planos de Ação"])
def get_all_planos_acao(
        skip: int = Query(0, ge=0, description="Number of records to skip"),
        limit: int = Query(10, ge=1, le=100, description="Maximum number of records to return")
    ) -> PlanoBasePage:
    """
    Endpoint to get all action plans with pagination.
    """
    planos = all_planos_acao()
    paginated_planos = planos[skip:skip + limit]
    parsed = parse_plano_acao_basico(paginated_planos, to_pydantic=True)
    page = PlanoBasePage(
        total=len(planos),
        skip=skip,
        limit=limit,
        data=parsed
    )

    return page

@app.get('/planos-acao/beneficiario', tags=["Planos de Ação", 'Beneficiário'])
def get_planos_acao_beneficiario(
        id_beneficiario: str=Query(ID_BENEFICIARIO, description="ID do beneficiário"),
        skip: int = Query(0, ge=0, description="Number of records to skip"),
        limit: int = Query(10, ge=1, le=100, description="Maximum number of records to return")
    ) -> PlanoBasePage:
    """
    Endpoint to get action plans for a specific beneficiary with pagination.
    If ID_BENEFICIARIO is the default value, it's more efficient because it can cache the results.
    """

    if id_beneficiario == ID_BENEFICIARIO:
        planos = planos_acao_beneficiario_default()
    else:
        planos = planos_acao_beneficiario(id_beneficiario)

    paginated_planos = planos[skip:skip + limit]
    parsed = parse_plano_acao_basico(paginated_planos, to_pydantic=True)
    page = PlanoBasePage(
        total=len(planos),
        skip=skip,
        limit=limit,
        data=parsed
    )

    return page


@app.get('/planos-acao/status', tags=["Status dos Planos de Ação", 'Beneficiário'])
def get_status_planos_acao_beneficiario(
        id_beneficiario: Optional[str]=Query(None, description=f"ID do beneficiário. Optimized for {ID_BENEFICIARIO}")
    ) -> List[StatusCount]:
    """
    Endpoint to get the status of action plans for a specific beneficiary.
    If ID_BENEFICIARIO is the default value, it's more efficient because it can cache the results.
    """
    if id_beneficiario is not None:
        if id_beneficiario == ID_BENEFICIARIO:
            status = status_planos_acao_beneficiario_default()
        else:
            status = status_plano_acao_beneficiario(id_beneficiario)
    else:
        status = status_planos_acao_all()

    return parse_status_counts(status)


@app.get('/planos-acao-detailed', tags=["Planos de Ação Detalhados"])
def get_all_planos_acao_detailed(
        skip: int = Query(0, ge=0, description="Number of records to skip"),
        limit: int = Query(10, ge=1, le=100, description="Maximum number of records to return")
    ) -> PlanoDetailedPage:
    """
    Endpoint to get all action plans with detailed information.
    """
    total, paginated_planos = planos_acao_detailed(skip=skip, limit=limit)
    parsed = [parse_plano_acao_detailed(plano, to_pydantic=True)
              for plano in paginated_planos]
    page = PlanoDetailedPage(
        total=total,
        skip=skip,
        limit=limit,
        data=parsed
    )

    return page

@app.get('/planos-acao-detailed/beneficiario/', tags=["Planos de Ação Detalhados", "Beneficiário"])
def get_planos_acao_detailed_beneficiario(
        id_beneficiario: str=Query(ID_BENEFICIARIO, description="ID do beneficiário"),
        skip: int = Query(0, ge=0, description="Number of records to skip"),
        limit: int = Query(10, ge=1, le=100, description="Maximum number of records to return")
    ) -> PlanoDetailedPage:
    """
    Endpoint to get detailed action plans for a specific beneficiary.
    If ID_BENEFICIARIO is the default value, it's more efficient because it can cache the results.
    """
    if id_beneficiario == ID_BENEFICIARIO:
        total, planos = planos_acao_detailed_beneficiario_default()
        paginated_planos = planos[skip:skip + limit]

    else:
        #already paginated
        total, paginated_planos = planos_acao_detailed_beneficiario(id_beneficiario, skip, limit)


    parsed = [parse_plano_acao_detailed(plano, to_pydantic=True)
              for plano in paginated_planos]
    page = PlanoDetailedPage(
        total=total,
        skip=skip,
        limit=limit,
        data=parsed
    )

    return page