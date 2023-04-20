from core.utils.env import get_env_variable

HOST = get_env_variable('host_sei')
WSDL = HOST + '/' + get_env_variable('endpoint_wsdl')
USER = get_env_variable('sigla_sistema')
PASSW = get_env_variable('identificacao_servico')