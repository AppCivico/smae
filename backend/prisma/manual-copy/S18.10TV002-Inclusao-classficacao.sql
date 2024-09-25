ALTER TABLE transferencia ADD classificacao_id int4 NULL;
ALTER TABLE transferencia ADD CONSTRAINT transferencia_classificacao_id_fkey FOREIGN KEY (classificacao_id) REFERENCES classificacao(id) ON DELETE RESTRICT ON UPDATE RESTRICT;
