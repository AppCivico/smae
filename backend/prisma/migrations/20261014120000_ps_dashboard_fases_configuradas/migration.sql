-- Panorama (quadro de grandes números e lista de metas) com as fases configuradas do monitoramento físico.
-- Preenchidas por refresh_ps_meta_consolidado (manual-copy/0027) apenas na linha da meta, quando
-- Pdm.monitoramento_por_blocos = true.
ALTER TABLE "ps_dashboard_consolidado" ADD COLUMN "fase_atual_config_id" INTEGER,
ADD COLUMN "fases_preenchidas" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
