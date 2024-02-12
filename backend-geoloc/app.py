from fastapi import FastAPI
from v1 import endpoints_busca_endereco, endpoints_camadas


#pode colocar markdown
description = """
## API para geolocalização de endereços integrada com o GeoSampa.

Desenvolvimento interno - time de **tecnologia de SEPEP** 🚀

Busque um endereço em texto livre localizado em São Paulo.
Nós devolveremos esse endereço geolocalizado, acompanhado dos dados das camadas do GeoSampa que te interessarem.

"""

app = FastAPI(openapi_url="/",
    title="SEPEPGeoLoc",
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

app.include_router(endpoints_busca_endereco)
app.include_router(endpoints_camadas)


