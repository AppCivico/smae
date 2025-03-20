#
FROM python:3.9

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
CMD ["sh", "-c", "export SOF_API_VERSION=v4 && uvicorn api:app --host 0.0.0.0 --port 80"]