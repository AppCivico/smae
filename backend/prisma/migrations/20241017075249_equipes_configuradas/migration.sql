-- AlterTable
ALTER TABLE "variavel" ADD COLUMN     "equipes_configuradas" BOOLEAN NOT NULL DEFAULT false;

--- Medicao    Validacao     Liberacao
update variavel set equipes_configuradas = true
WHERE id in (
    select me.variavel_id
    from variavel_grupo_responsavel_equipe me
    join grupo_responsavel_equipe g on g.id = me.grupo_responsavel_equipe_id and g.perfil = 'Medicao'
    where me.removido_em is null
) and  id in (
    select me.variavel_id
    from variavel_grupo_responsavel_equipe me
    join grupo_responsavel_equipe g on g.id = me.grupo_responsavel_equipe_id and g.perfil = 'Validacao'
    where me.removido_em is null
)
and id in (
    select me.variavel_id
    from variavel_grupo_responsavel_equipe me
    join grupo_responsavel_equipe g on g.id = me.grupo_responsavel_equipe_id and g.perfil = 'Liberacao'
    where me.removido_em is null
);
