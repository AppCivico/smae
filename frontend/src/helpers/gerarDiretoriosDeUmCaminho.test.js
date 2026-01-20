import { describe, expect, it } from 'vitest';
import gerarDiretoriosDeUmCaminho from './gerarDiretoriosDeUmCaminho';

describe('gerarDiretoriosDeUmCaminho', () => {
  it('deve gerar a lista correta de diretórios para um caminho dado', () => {
    const caminho = '/var/logs/app/debug/details/';
    const esperado = [
      '/',
      '/var/',
      '/var/logs/',
      '/var/logs/app/',
      '/var/logs/app/debug/',
      '/var/logs/app/debug/details/',
    ];

    const resultado = gerarDiretoriosDeUmCaminho(caminho);
    expect(resultado).toEqual(esperado);
  });

  it('deve retornar uma lista com apenas a raiz quando o caminho for "/"', () => {
    const caminho = '/';
    const esperado = ['/'];
    const resultado = gerarDiretoriosDeUmCaminho(caminho);
    expect(resultado).toEqual(esperado);
  });

  it('deve lidar corretamente com caminhos sem barra final', () => {
    const caminho = '/var/logs/app/debug/details';
    const esperado = [
      '/',
      '/var/',
      '/var/logs/',
      '/var/logs/app/',
      '/var/logs/app/debug/',
      '/var/logs/app/debug/details/',
    ];
    const resultado = gerarDiretoriosDeUmCaminho(caminho);
    expect(resultado).toEqual(esperado);
  });

  it('deve retornar vazio quando o caminho for o diretório corrente', () => {
    const caminho = './';
    const esperado = [''];
    const resultado = gerarDiretoriosDeUmCaminho(caminho);
    expect(resultado).toEqual(esperado);
  });

  it('deve lidar corretamente com caminhos relativos explícitos', () => {
    const caminho = './var/logs/app/';
    const esperado = [
      'var/',
      'var/logs/',
      'var/logs/app/',
    ];
    const resultado = gerarDiretoriosDeUmCaminho(caminho);
    expect(resultado).toEqual(esperado);
  });

  it('deve lidar corretamente com caminhos relativos implícitos', () => {
    const caminho = 'var/logs/app/';
    const esperado = [
      'var/',
      'var/logs/',
      'var/logs/app/',
    ];
    const resultado = gerarDiretoriosDeUmCaminho(caminho);
    expect(resultado).toEqual(esperado);
  });
});
