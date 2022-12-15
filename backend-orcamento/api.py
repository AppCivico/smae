from fastapi import FastAPI
from v1 import empenhos_routes, itens_dotacao_routes, orcado_routes


#pode colocar markdown
description = """
## API para o Middleware de Acompanhamento Orçamentário do **SMAE**.
Desenvolvimento interno - time de **tecnologia de SEPEP** 🚀
"""

app = FastAPI(openapi_url="/",
    title="Middleware_orcamento",
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

    
app.include_router(empenhos_routes, prefix="/v1/empenhos")
app.include_router(itens_dotacao_routes, prefix="/v1/itens_dotacao")
app.include_router(orcado_routes, prefix="/v1/orcado")


