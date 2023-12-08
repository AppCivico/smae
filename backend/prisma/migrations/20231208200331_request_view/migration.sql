create view view_api_request_log as
select
created_at,
cf_ray,
request_num,
date_trunc('day', created_at) as request_date,
REGEXP_REPLACE(req_path, '\d+', '*') as req_path_clean,
ip,
response_time,
response_size,
req_method,
req_path,
req_host,
req_headers,
req_query,
req_body,
req_body_size,
res_code,
created_pessoa_id
from api_request_log;
