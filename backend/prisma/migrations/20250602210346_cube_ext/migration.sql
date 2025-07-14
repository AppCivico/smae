/*

CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;

CREATE INDEX IF NOT EXISTS idx_geolocalizacao_earthloc ON geo_localizacao USING gist (ll_to_earth(lat, lon));

*/
