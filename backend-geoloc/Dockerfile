#
FROM python:3.11-slim

#
WORKDIR /code

#
COPY ./requirements.txt /code/requirements.txt

#Linhas adicionadas para resolver problema para instalar o GDAL
RUN apt-get update
RUN apt-get install -y gdal-bin libgdal-dev g++
###############################################################

RUN pip install --no-cache-dir --upgrade -r requirements.txt

#
COPY . /code/

#
CMD ["uvicorn", "app:app",  "--proxy-headers", "--host", "0.0.0.0", "--port", "80"]