export default ((númeroDeCasas = 0) => {
  switch (true) {
    case typeof númeroDeCasas === 'number' && númeroDeCasas > 0:
      return `0.${'0'.repeat(númeroDeCasas - 1)}1`;

    case !númeroDeCasas:
      return 1;

    case númeroDeCasas === 'any':
    default:
      return 'any';
  }
});
