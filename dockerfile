FROM alpine
RUN apk update --no-cache && apk upgrade && apk add --update python3 python3-dev py-pip libc6-compat build-base libffi-dev rust cargo openssl-dev
WORKDIR /app
RUN pip install -U pip
RUN pip install wheel
COPY requirements.txt api.py /app/
RUN pip install --no-cache-dir -r requirements.txt
EXPOSE 80 443
# CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "80"]
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "443", "--ssl-certfile=/app/launchchess.com.pem"]
