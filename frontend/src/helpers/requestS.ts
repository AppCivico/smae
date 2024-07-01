import $eventHub from '@/components/eventHub';
import responseDownload from '@/helpers/responseDownload';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import qs from 'qs';

type Method = 'GET' | 'POST' | 'UPLOAD' | 'PUT' | 'PATCH' | 'DELETE';

type Alerta = {
  message: string;
  callback?: Function;
  fallback?: Function;
  type: 'alert-success' | 'alert-danger' | 'confirm' | 'confirmAction';
  label?: string;
};

function listErrors(r: String[]) {
  let o = '';
  if (typeof r === 'object') {
    r.forEach((rr:String) => {
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
    return {
      Authorization: `Bearer ${authStore.token}`,
      'smae-sistemas': !authStore.sistemaEscolhido || authStore.sistemaEscolhido === 'SMAE'
        ? 'SMAE,PDM,CasaCivil,Projetos,PlanoSetorial'
        : `SMAE,${authStore.sistemaEscolhido}`,
    };
  }
  return {};
}

function request(method: Method, upload = false) {
  return (
    url: RequestInfo | URL,
    params: { [key: string]: any } | undefined,
    AlertarErros:Boolean = true,
  ) => {
    let urlFinal = url;

    const requestOptions: RequestInit = {
      method,
      headers: userToken(urlFinal),
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
          requestOptions.headers = {
            ...requestOptions.headers,
            'Content-Type': 'application/json',
          };
          requestOptions.body = JSON.stringify(params);
        } else {
          // requestOptions.headers['Content-Type'] = 'multipart/form-data';
          requestOptions.body = params as FormData;
        }
        break;
    }

    // return fetch(urlFinal, requestOptions).then(handleResponse);
    return fetch(urlFinal, requestOptions)
      .then((response) => handleResponse(response, AlertarErros))
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

export default {
  get: request('GET'),
  post: request('POST'),
  upload: request('POST', true),
  put: request('PUT'),
  patch: request('PATCH'),
  delete: request('DELETE'),
};
