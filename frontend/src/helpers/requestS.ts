import qs from 'qs';
import $eventHub from '@/components/eventHub';
import responseDownload from '@/helpers/responseDownload';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { serializarCampos, serializarEdicoesEmMassa } from '@/helpers/serializarCamposFormSchema';

type Method = 'GET' | 'POST' | 'UPLOAD' | 'PUT' | 'PATCH' | 'DELETE';

export type ParametrosDeRequisicao = URLSearchParams
| Record<string, unknown>
| FormData
| null;

export type RequestS = {
  get: (
    url: RequestInfo | URL,
    params?: ParametrosDeRequisicao,
    opcoes?: Record<string, unknown>
  ) => Promise<unknown>;
  post: (
    url: RequestInfo | URL,
    params: ParametrosDeRequisicao,
    opcoes?: Record<string, unknown>
  ) => Promise<unknown>;
  upload: (
    url: RequestInfo | URL,
    params: ParametrosDeRequisicao,
    opcoes?: Record<string, unknown>
  ) => Promise<unknown>;
  put: (
    url: RequestInfo | URL,
    params: ParametrosDeRequisicao,
    opcoes?: Record<string, unknown>
  ) => Promise<unknown>;
  patch: (
    url: RequestInfo | URL,
    params: ParametrosDeRequisicao,
    opcoes?: Record<string, unknown>
  ) => Promise<unknown>;
  delete: (
    url: RequestInfo | URL,
    params?: ParametrosDeRequisicao,
    opcoes?: Record<string, unknown>
  ) => Promise<unknown>;
};

type Alerta = {
  message: string;
  callback?: () => void;
  fallback?: () => void;
  type: 'alert-success' | 'alert-danger' | 'confirm' | 'confirmAction';
  label?: string;
};

function listErrors(r: string[]) {
  let o = '';
  if (typeof r === 'object') {
    r.forEach((rr:string) => {
      o += `${rr.includes('|') ? rr.split('| ')[1] : rr}\r\n`;
    });
    return o;
  }
  return r;
}

async function handleResponse(response: Response, alertarErros = true):Promise<object | null> {
  const isJson = response.headers?.get('content-type')?.includes('application/json');
  const isZip = response.headers?.get('content-type')?.includes('application/zip');

  const data = isJson ? await response.json() : true;
  if (!response.ok) {
    if ([204].includes(response.status)) return Promise.resolve;
    const alertStore = useAlertStore();
    const { user } = useAuthStore();
    let msgDefault;
    if ([401, 403].includes(response.status) && user) {
      msgDefault = 'Sem permissão para acessar.';
    }
    if ([502].includes(response.status) && user) {
      msgDefault = 'Erro de comunicação do servidor.';
    }
    const error = (data && data.message)
      ? listErrors(data.message)
      : msgDefault
      ?? response.status;

    if (import.meta.env.VITE_EXPOR_ERROS === 'true' || import.meta.env.DEV) {
      console.trace('Erro:', error);
    }

    if (alertarErros) {
      if (!alertStore.alertas.some((alerta:Alerta) => alerta.message === error)) {
        alertStore.error(error);
      }
    }
    return Promise.reject(error);
  }

  if (isZip) {
    responseDownload(response);
  }

  return Promise.resolve(data);
}

function userToken(url: RequestInfo | URL): HeadersInit {
  const authStore = useAuthStore();
  const isLoggedIn = !!authStore.token;
  const isApiUrl = String(url).startsWith(import.meta.env.VITE_API_URL);

  if (isLoggedIn && isApiUrl) {
    const headers: HeadersInit = {
      Authorization: `Bearer ${authStore.token}`,
    };
    if (authStore.sistemaCorrente && authStore.sistemaCorrente !== 'SMAE') {
      headers['smae-sistemas'] = `SMAE,${authStore.sistemaCorrente}`;
    }
    return headers;
  }
  return {};
}

function request(method: Method, upload = false) {
  return (
    url: RequestInfo | URL,
    params: ParametrosDeRequisicao = null,
    opcoes: { AlertarErros?: boolean; headers?: HeadersInit } = { AlertarErros: true },
  ) => {
    let urlFinal = url;

    const requestOptions: RequestInit = {
      method,
      headers: {
        ...userToken(urlFinal),
        ...opcoes.headers,
      },
    };

    switch (method) {
      case 'GET':
        $eventHub.emit('recebimentoIniciado');
        if (params && Object.keys(params).length) {
          urlFinal += `?${qs.stringify(params, { indices: false })}`;
        }
        break;

      default:
        $eventHub.emit('envioIniciado');
        if (params && !upload) {
          let dados = params;
          const schema = opcoes?.schema;

          if (schema) {
            // assumimos que .ops existe apenas em edição em lote
            if (params?.ops && Array.isArray(params.ops)) {
              const novasOps = serializarEdicoesEmMassa(schema, params.ops);
              dados = { ...params, ops: novasOps };
            } else {
              dados = serializarCampos(schema, params);
            }
          }
          requestOptions.headers = {
            ...requestOptions.headers,
            'Content-Type': 'application/json',
          };
          requestOptions.body = JSON.stringify(dados);
        } else {
          // requestOptions.headers['Content-Type'] = 'multipart/form-data';
          requestOptions.body = params as FormData;
        }
        break;
    }

    // return fetch(urlFinal, requestOptions).then(handleResponse);
    return fetch(urlFinal, requestOptions)
      .then((response) => handleResponse(response, opcoes.AlertarErros))
      .finally(() => {
        switch (method) {
          case 'GET':
            $eventHub.emit('recebimentoEncerrado');
            break;
          default:
            $eventHub.emit('envioEncerrado');
            break;
        }
      });
  };
}

const requestS: RequestS = {
  get: request('GET'),
  post: request('POST'),
  upload: request('POST', true),
  put: request('PUT'),
  patch: request('PATCH'),
  delete: request('DELETE'),
};

export default requestS;
