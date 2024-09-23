CREATE TABLE classificacao (
       id serial4 NOT NULL,
       nome text NOT NULL,
       transferencia_tipo_id int4 NULL,
       criado_por int4 NOT NULL,
       criado_em timestamptz(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
       atualizado_por int4 NULL,
       atualizado_em timestamptz(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
       removido_por int4 NULL,
       removido_em timestamptz(6) NULL,
       CONSTRAINT classificacao_pkey PRIMARY KEY (id)
);
CREATE INDEX classificacao_nome_idx ON classificacao USING btree (nome);

ALTER TABLE public.classificacao ADD CONSTRAINT classificacao_transferencia_tipo_fk FOREIGN KEY (transferencia_tipo_id) REFERENCES transferencia_tipo(id) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE public.classificacao ADD CONSTRAINT transferencia_tipo_atualizado_por_fkey FOREIGN KEY (atualizado_por) REFERENCES pessoa(id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE public.classificacao ADD CONSTRAINT transferencia_tipo_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES pessoa(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE public.classificacao ADD CONSTRAINT transferencia_tipo_removido_por_fkey FOREIGN KEY (removido_por) REFERENCES pessoa(id) ON DELETE SET NULL ON UPDATE CASCADE;
