/* eslint-disable max-len */
interface Etapa {
  regiao_id: string | number,
  etapa_filha: Etapa[],
}

/**
 * Confere se uma etapa tem descendentes numa região diferente dela.
 *
 * @param {(string | number)} idDaRegião
 * @param {Etapa[]} [etapaFilha=[]]
 * @return {*}  {boolean}
 */
const temDescendenteEmOutraRegião = (idDaRegião: string | number, etapaFilha: Etapa[] = []): boolean => etapaFilha
  // eslint-disable-next-line eqeqeq
  .some((x) => (x.regiao_id && x.regiao_id != idDaRegião)
    || temDescendenteEmOutraRegião(idDaRegião, x.etapa_filha));

export default temDescendenteEmOutraRegião;
