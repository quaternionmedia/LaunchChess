FROM python
WORKDIR /app
RUN pip install -U pip wheel
COPY requirements.txt api.py /app/
RUN pip install --no-cache-dir -r requirements.txt
EXPOSE 443

CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "443", "--ssl-certfile=/app/launchchess.com.pem"]
