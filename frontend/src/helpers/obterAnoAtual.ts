import { getYear } from 'date-fns';

function obterAnoAtual() {
  return getYear(new Date()).toString();
}

export default obterAnoAtual;
