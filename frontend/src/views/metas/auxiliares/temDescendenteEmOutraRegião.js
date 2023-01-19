const temDescendenteEmOutraRegião = (idDaRegião, etapaFilha = []) => etapaFilha
// eslint-disable-next-line eqeqeq
  .some((x) => (x.regiao_id && x.regiao_id != idDaRegião)
      || temDescendenteEmOutraRegião(idDaRegião, x.etapa_filha));

export default temDescendenteEmOutraRegião;
