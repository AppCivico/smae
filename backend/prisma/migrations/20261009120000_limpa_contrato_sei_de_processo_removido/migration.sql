-- Processos SEI removidos do projeto/obra continuavam nos contratos (contrato_sei guarda só o número,
-- sem FK para projeto_registro_sei): apareciam na lista/resumo do contrato, mas não podiam ser
-- retirados pela edição, que só oferece os processos ainda cadastrados.
-- A remoção do processo agora já limpa os contratos; aqui corrige o que ficou para trás.
--
-- Apaga apenas o que comprovadamente veio de um processo removido de um projeto/obra vinculado e que
-- não segue cadastrado em nenhum deles. Números que nunca foram cadastrados como processo do projeto
-- (ex.: carga inicial) não são tocados.
-- A comparação é feita pelos dígitos: há numero_sei antigos gravados com máscara.
DELETE FROM contrato_sei cs
USING contrato c
WHERE c.id = cs.contrato_id
  AND c.removido_em IS NULL
  AND EXISTS (
      SELECT 1
      FROM contrato_projeto cp
      JOIN projeto p ON p.id = cp.projeto_id AND p.removido_em IS NULL
      JOIN projeto_registro_sei prs ON prs.projeto_id = cp.projeto_id
      WHERE cp.contrato_id = cs.contrato_id
        AND cp.removido_em IS NULL
        AND prs.removido_em IS NOT NULL
        AND prs.processo_sei = regexp_replace(cs.numero_sei, '[^0-9]', '', 'g')
  )
  AND NOT EXISTS (
      SELECT 1
      FROM contrato_projeto cp
      JOIN projeto p ON p.id = cp.projeto_id AND p.removido_em IS NULL
      JOIN projeto_registro_sei prs ON prs.projeto_id = cp.projeto_id
      WHERE cp.contrato_id = cs.contrato_id
        AND cp.removido_em IS NULL
        AND prs.removido_em IS NULL
        AND prs.processo_sei = regexp_replace(cs.numero_sei, '[^0-9]', '', 'g')
  );
