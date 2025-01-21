import modulosDoSistema from '@/consts/modulosDoSistema';

const mapaDeModulos = Object.keys(modulosDoSistema).reduce((acc, key) => {
  const modulo = modulosDoSistema[key as keyof typeof modulosDoSistema];
  if (Array.isArray(modulo.possiveisEntidadesMae)) {
    modulo.possiveisEntidadesMae.forEach((possiveisEntidadesMae) => {
      acc[possiveisEntidadesMae] = key;
    });
  } else {
    acc[modulo.possiveisEntidadesMae] = key;
  }
  return acc;
}, {} as Record<string, string>);

export default ((possiveisEntidadesMae: string) => mapaDeModulos[possiveisEntidadesMae] || '');
