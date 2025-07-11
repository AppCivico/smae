#
FROM python:3.12

# Update package list and install ca-certificates
RUN apt-get update && \
    apt-get install -y ca-certificates && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Update CA certificates
RUN update-ca-certificates

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