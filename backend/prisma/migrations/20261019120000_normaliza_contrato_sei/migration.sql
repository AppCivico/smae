-- contrato_sei.numero_sei passa a ser gravado só com dígitos (mesmo formato de projeto_registro_sei.processo_sei).
-- Linhas antigas foram gravadas com máscara (`6014.2021/0002493-0`) e há contratos com o mesmo processo duas
-- vezes, com e sem máscara. Mantém a linha de menor id de cada (contrato, número) e normaliza o restante.
--
-- Processos que não estão cadastrados em nenhuma obra/projeto vinculado não são tocados aqui: o formulário do
-- contrato passa a exigir o cadastro, e a correção fica com quem edita o contrato.
DELETE FROM contrato_sei cs
USING contrato_sei manter
WHERE manter.contrato_id = cs.contrato_id
  AND regexp_replace(manter.numero_sei, '[^0-9]', '', 'g') = regexp_replace(cs.numero_sei, '[^0-9]', '', 'g')
  AND manter.id < cs.id;

UPDATE contrato_sei
SET numero_sei = regexp_replace(numero_sei, '[^0-9]', '', 'g')
WHERE numero_sei ~ '[^0-9]'
  AND regexp_replace(numero_sei, '[^0-9]', '', 'g') <> '';
