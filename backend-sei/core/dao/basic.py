from .decorators import set_client

@set_client
def lst_unidades(client)->list:

    return client('listar_unidades', id_tipo_procedimento=None, id_serie=None)


@set_client
def lst_tipos_processo(client)->list:

    return client('listar_tipos_procedimento', id_unidade=None, id_serie=None)


@set_client
def lst_tipos_documento(client)->list:

    return client('listar_series', id_unidade=None, id_tipo_procedimento=None)


@set_client
def lst_hipoteses_legais_acesso_restrito(client)->list:

    return client('listar_hipoteses_legais', id_unidade=None, nivel_acesso=1)




