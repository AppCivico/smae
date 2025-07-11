from fastapi import FastAPI
from v1 import endpoints_planos_acao


#pode colocar markdown
description = """
## API para busca de oportunidades em Transferências Especiais.

Desenvolvimento interno - time de **tecnologia de SEPEP** 🚀

Retorna oportunidades em Transferências Especiais do Governo Federal, por meio de integração com o TransfereGov.

"""

app = FastAPI(openapi_url="/",
    title="Oportunidades Transferências Especiais",
    description=description,
    version="0.0.1",
    #terms_of_service="http://example.com/terms/",
    contact={
        "name": "SEPEP",
        "url": "https://www.prefeitura.sp.gov.br/cidade/secretarias/governo/planejamento/",
        "email": "hpougy@prefeitura.sp.gov.br",
    },
    license_info={
        "name": "AGPL V3.0",
        "url": "https://www.gnu.org/licenses/agpl-3.0.en.html",
    },
    )

app.include_router(endpoints_planos_acao)
