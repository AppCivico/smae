CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
SELECT create_hypertable('api_request_log', 'created_at', chunk_time_interval => INTERVAL '1 day', migrate_data => true);
