
ALTER TYPE "PerfilResponsavelVariavel" ADD VALUE 'AdminPS';
ALTER TYPE "PerfilResponsavelVariavel" ADD VALUE 'TecnicoPS';
ALTER TYPE "PerfilResponsavelVariavel" ADD VALUE 'PontoFocalPS';

ALTER TYPE  "PerfilResponsavelVariavel" RENAME TO "PerfilResponsavelEquipe";


-- Rename Table
ALTER TABLE "grupo_responsavel_variavel" RENAME TO "grupo_responsavel_equipe";

-- Rename Constraints
ALTER TABLE "grupo_responsavel_equipe" RENAME CONSTRAINT "grupo_responsavel_variavel_orgao_id_fkey" TO "grupo_responsavel_equipe_orgao_id_fkey";

-- Rename Related Tables
ALTER TABLE "grupo_responsavel_variavel_colaborador" RENAME TO "grupo_responsavel_equipe_colaborador";
ALTER TABLE "grupo_responsavel_variavel_pessoa" RENAME TO "grupo_responsavel_equipe_pessoa";
ALTER TABLE "variavel_grupo_responsavel_variavel" RENAME TO "variavel_grupo_responsavel_equipe";


-- Rename Foreign Key Constraints before renaming columns
ALTER TABLE "grupo_responsavel_equipe_colaborador" RENAME CONSTRAINT "grupo_responsavel_variavel_colaborador_grupo_responsavel_v_fkey" TO "grupo_responsavel_equipe_colaborador_grupo_responsavel_equ_fkey";
ALTER TABLE "grupo_responsavel_equipe_pessoa" RENAME CONSTRAINT "grupo_responsavel_variavel_pessoa_grupo_responsavel_variav_fkey" TO "grupo_responsavel_equipe_pessoa_grupo_responsavel_equipe_i_fkey";
ALTER TABLE "variavel_grupo_responsavel_equipe" RENAME CONSTRAINT "variavel_grupo_responsavel_variavel_grupo_responsavel_vari_fkey" TO "variavel_grupo_responsavel_equipe_grupo_responsavel_equipe_fkey";

-- Rename Columns instead of dropping and adding
ALTER TABLE "grupo_responsavel_equipe_colaborador" RENAME COLUMN "grupo_responsavel_variavel_id" TO "grupo_responsavel_equipe_id";
ALTER TABLE "grupo_responsavel_equipe_pessoa" RENAME COLUMN "grupo_responsavel_variavel_id" TO "grupo_responsavel_equipe_id";
ALTER TABLE "variavel_grupo_responsavel_equipe" RENAME COLUMN "grupo_responsavel_variavel_id" TO "grupo_responsavel_equipe_id";

-- Rename Primary Key Constraints
ALTER TABLE "grupo_responsavel_equipe" RENAME CONSTRAINT "grupo_responsavel_variavel_pkey" TO "grupo_responsavel_equipe_pkey";
ALTER TABLE "grupo_responsavel_equipe_colaborador" RENAME CONSTRAINT "grupo_responsavel_variavel_colaborador_pkey" TO "grupo_responsavel_equipe_colaborador_pkey";
ALTER TABLE "grupo_responsavel_equipe_pessoa" RENAME CONSTRAINT "grupo_responsavel_variavel_pessoa_pkey" TO "grupo_responsavel_equipe_pessoa_pkey";
ALTER TABLE "variavel_grupo_responsavel_equipe" RENAME CONSTRAINT "variavel_grupo_responsavel_variavel_pkey" TO "variavel_grupo_responsavel_equipe_pkey";


-- Rename Foreign Key Constraint on "variavel_grupo_responsavel_equipe"
ALTER TABLE "variavel_grupo_responsavel_equipe" RENAME CONSTRAINT "variavel_grupo_responsavel_variavel_variavel_id_fkey" TO "variavel_grupo_responsavel_equipe_variavel_id_fkey";

-- Rename Foreign Key Constraints
ALTER TABLE "grupo_responsavel_equipe_colaborador"
    RENAME CONSTRAINT "grupo_responsavel_variavel_colaborador_orgao_id_fkey" TO "grupo_responsavel_equipe_colaborador_orgao_id_fkey";

ALTER TABLE "grupo_responsavel_equipe_colaborador"
    RENAME CONSTRAINT "grupo_responsavel_variavel_colaborador_pessoa_id_fkey" TO "grupo_responsavel_equipe_colaborador_pessoa_id_fkey";

ALTER TABLE "grupo_responsavel_equipe_pessoa"
    RENAME CONSTRAINT "grupo_responsavel_variavel_pessoa_orgao_id_fkey" TO "grupo_responsavel_equipe_pessoa_orgao_id_fkey";

ALTER TABLE "grupo_responsavel_equipe_pessoa"
    RENAME CONSTRAINT "grupo_responsavel_variavel_pessoa_pessoa_id_fkey" TO "grupo_responsavel_equipe_pessoa_pessoa_id_fkey";
