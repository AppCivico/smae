#
FROM python:3.9-alpine

#
WORKDIR /code

#
COPY ./requirements.txt /code/requirements.txt

#
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

#
COPY . /code/

ENV SOF_API_TOKEN=""

#
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "80"]