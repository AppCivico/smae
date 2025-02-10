function aleatorio(): string {
  return Math.random().toString(36).substring(2);
}

export function gerarToken(saltos = 2):string {
  let token = '';

  for (let i = 0; i < saltos; i += 1) {
    console.log('salto', i);

    token += aleatorio();
  }

  return token;
}

export default gerarToken;
