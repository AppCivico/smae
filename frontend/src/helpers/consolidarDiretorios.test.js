import { describe, expect, it } from 'vitest';
import consolidarDiretorios from './consolidarDiretorios';

const esperado = [
  {
    id: '_barra_',
    caminho: '/',
    pai: null,
    nome: '/',
  },
  {
    id: '_barra_var_barra_',
    caminho: '/var/',
    nome: 'var',
    pai: '_barra_',
  },
  {
    id: '_barra_var_barra_logs_barra_',
    caminho: '/var/logs/',
    nome: 'logs',
    pai: '_barra_var_barra_',
  },
  {
    id: '_barra_var_barra_logs_barra_app_barra_',
    caminho: '/var/logs/app/',
    nome: 'app',
    pai: '_barra_var_barra_logs_barra_',
  },
  {
    id: '_barra_var_barra_logs_barra_app_barra_debug_barra_',
    caminho: '/var/logs/app/debug/',
    nome: 'debug',
    pai: '_barra_var_barra_logs_barra_app_barra_',
  },
  {
    id: '_barra_var_barra_logs_barra_app_barra_debug_barra_details_barra_',
    caminho: '/var/logs/app/debug/details/',
    nome: 'details',
    pai: '_barra_var_barra_logs_barra_app_barra_debug_barra_',
  },
  {
    id: '_barra_var_barra_logs_barra_app_barra_error_barra_',
    caminho: '/var/logs/app/error/',
    nome: 'error',
    pai: '_barra_var_barra_logs_barra_app_barra_',
  },
  {
    id: '_barra_var_barra_logs_barra_app_barra_info_barra_',
    caminho: '/var/logs/app/info/',
    nome: 'info',
    pai: '_barra_var_barra_logs_barra_app_barra_',
  },
];

describe('consolidarDiretorios', () => {
  it('deve consolidar diretórios removendo duplicatas e mantendo a hierarquia', () => {
    const entradas = [
      '/var/logs/app/',
      '/var/logs/app/error/',
      '/var/logs/app/info/',
      '/var/logs/app/error/',
      '/var/logs/app/info/',
      '/var/logs/app/debug/details/',
    ];
    const resultado = consolidarDiretorios(entradas);
    expect(resultado).toEqual(esperado);
  });

  it('deve retornar uma lista vazia quando a entrada for vazia', () => {
    const resultado = consolidarDiretorios([]);
    expect(resultado).toEqual([]);
  });

  it('deve lidar corretamente com entradas sem barras finais', () => {
    const entradas = [
      '/var/logs/app',
      '/var/logs/app/error/',
      '/var/logs/app/error',
      '/var/logs/app/info',
      '/var/logs/app/debug/details/',
    ];

    const resultado = consolidarDiretorios(entradas);
    expect(resultado).toEqual(esperado);
  });
});
