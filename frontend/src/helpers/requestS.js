import responseDownload from '@/helpers/responseDownload';
import { useAlertStore, useAuthStore } from '@/stores';

export const requestS = {
  get: request('GET'),
  post: request('POST'),
  upload: request('POST', 1),
  put: request('PUT'),
  patch: request('PATCH'),
  delete: request('DELETE'),
};

function request(method, upload) {
  return (url, params) => {
    const requestOptions = {
      method,
      headers: userToken(url),
    };

    switch (method) {
      case 'GET':
        if (params && Object.keys(params).length) {
          url += `?${new URLSearchParams(params).toString()}`;
        }
        break;

      default:
        if (params && !upload) {
          requestOptions.headers['Content-Type'] = 'application/json';
          requestOptions.body = JSON.stringify(params);
        } else {
          // requestOptions.headers['Content-Type'] = 'multipart/form-data';
          requestOptions.body = params;
        }
        break;
    }

    return fetch(url, requestOptions).then(handleResponse);
  };
}

function userToken(url) {
  const { token } = useAuthStore();
  const isLoggedIn = !!token;
  const isApiUrl = url.startsWith(import.meta.env.VITE_API_URL);
  if (isLoggedIn && isApiUrl) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

function listErrors(r) {
  let o = '';
  if (typeof r === 'object') {
    r.forEach((rr) => {
      o += `${rr.includes('|') ? rr.split('| ')[1] : rr}\r\n`;
    });
    return o;
  }
  return r;
}

async function handleResponse(response) {
  const isJson = response.headers?.get('content-type')?.includes('application/json');
  const isZip = response.headers?.get('content-type')?.includes('application/zip');

  const data = isJson ? await response.json() : true;
  if (!response.ok) {
    if ([204].includes(response.status)) return;
    const alertStore = useAlertStore();
    const { user } = useAuthStore();
    let msgDefault;
    if ([401, 403].includes(response.status) && user) {
      msgDefault = 'Sem permissão para acessar.';
    }
    if ([502].includes(response.status) && user) {
      msgDefault = 'Erro de comunicação do servidor.';
    }
    const error = (data && data.message) ? listErrors(data.message) : msgDefault ?? response.status;
    alertStore.error(error);
    return Promise.reject(error);
  } if (isZip) {
    responseDownload(response);
  }

  return data;
}
