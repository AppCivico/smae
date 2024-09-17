from fastapi import FastAPI

from v1 import ultima_atualiz_routes, transferencias_routes

#pode colocar markdown
description = """
## API para o Middleware de Integração com o TransfereGov do **SMAE**.
Tem por objetivo identificar recursos em potencial para serem utilizados pela cidade de São Paulo.
Desenvolvimento interno - **CODATA/SEPEP** 🚀
"""


app = FastAPI(openapi_url="/",
    title="Middleware_funil_transferencias",
    description=description,
    version="0.0.1",
    #terms_of_service="http://example.com/terms/",
    contact={
        "name": "SEPEP",
        "url": "https://www.prefeitura.sp.gov.br/cidade/secretarias/governo/planejamento/",
        "email": "codata@prefeitura.sp.gov.br",
    },
    license_info={
        "name": "AGPL V3.0",
        "url": "https://www.gnu.org/licenses/agpl-3.0.en.html",
    },
    )


app.include_router(transferencias_routes, prefix="/v1")
app.include_router(ultima_atualiz_routes, prefix="/v1")