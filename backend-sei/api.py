from fastapi import FastAPI
from v1 import basic_routes, processo_routes, documento_routes

#pode colocar markdown
description = """
## API para o Middleware de Integração com o SEI do **SMAE**.
Desenvolvimento interno - **CODATA/SEPEP** 🚀
"""

app = FastAPI(openapi_url="/",
    title="Middleware_sei",
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

app.include_router(basic_routes, prefix="/v1")
app.include_router(processo_routes, prefix='/v1/processos')
app.include_router(documento_routes, prefix='/v1/documentos')