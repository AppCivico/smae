update distribuicao_status set id = id + 1000000;

select setval('distribuicao_status_id_seq'::regclass, 1000500);

