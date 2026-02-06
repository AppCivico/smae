import modulosDoSistema from '@/consts/modulosDoSistema';

import type { ModuloSistema } from '@/consts/modulosDoSistema';

const mapaDeModulos = Object.keys(modulosDoSistema).reduce((acc, key) => {
  const modulo = modulosDoSistema[key as keyof typeof modulosDoSistema];
  if (Array.isArray(modulo?.possiveisEntidadesMae)) {
    modulo.possiveisEntidadesMae.forEach((possiveisEntidadesMae) => {
      acc[possiveisEntidadesMae] = key as ModuloSistema;
    });
  } else if (modulo?.possiveisEntidadesMae) {
    acc[modulo.possiveisEntidadesMae] = key as ModuloSistema;
  }
  return acc;
}, {} as Record<string, ModuloSistema>);

export default ((possiveisEntidadesMae = ''): ModuloSistema | '' => mapaDeModulos[possiveisEntidadesMae] || '');
