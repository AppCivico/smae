from fastapi import FastAPI
from v1 import comunicados_routes

#pode colocar markdown
description = """
## API para o scrapper dos Comunicados do TransfereGov - middleware do **SMAE**.
Desenvolvimento interno - **CODATA/SEPEP** 🚀
"""

app = FastAPI(openapi_url="/",
    title="Comunicados_transferegov",
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

app.include_router(comunicados_routes, prefix="/v1")