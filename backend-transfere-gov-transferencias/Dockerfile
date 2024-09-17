#
FROM python:3.12

#
WORKDIR /code

#
COPY ./requirements.txt /code/requirements.txt

#
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

#
COPY . /code/

#expondo porta 80
EXPOSE 80/tcp

CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "80"]