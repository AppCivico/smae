UPDATE variavel AS child
SET variavel_mae_id = parent.id
FROM variavel AS parent
WHERE parent.tipo = 'Global' AND child.tipo = 'Global' AND parent.id <> child.id
  AND child.codigo LIKE '%/%'
  AND parent.codigo = SPLIT_PART(child.codigo, '/', 1) || '/' || SPLIT_PART(parent.codigo, '/', 2);
