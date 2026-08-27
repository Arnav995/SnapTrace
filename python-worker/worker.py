import json
import logging
import time
import cv2
import numpy as np
import psycopg2
import redis
import requests
from insightface.app import FaceAnalysis
from pgvector.psycopg2 import register_vector

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# 1. Initialize InsightFace (Buffalo_L model pack)
app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
app.prepare(ctx_id=0, det_size=(640, 640))

# 2. Database Connection
DB_URL = "postgresql://spotme_admin:spotme_password@localhost:5432/spotme_db"

def save_embedding(photo_id: str, event_id: str, vector: list[float]):
    conn = psycopg2.connect(DB_URL)
    register_vector(conn)
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO face_embeddings (photo_id, event_id, embedding) VALUES (%s, %s, %s)",
                (photo_id, event_id, vector)
            )
        conn.commit()
    finally:
        conn.close()

# 3. Queue Consumer
def start_worker():
    r = redis.Redis(host="localhost", port=6379, decode_responses=True)
    queue_key = "bull:photo-processing:wait"
    logging.info("🐍 Python Face Worker online. Waiting for job payloads...")

    while True:
        try:
            job_tuple = r.blpop(queue_key, timeout=5)
            if not job_tuple:
                continue

            job = json.loads(job_tuple[1])
            data = job.get("data", {})
            photo_id, event_id, s3_url = data.get("photoId"), data.get("eventId"), data.get("s3Url")

            if not photo_id or not s3_url:
                continue

            logging.info(f"Processing photo {photo_id} for event {event_id}")

            # Fetch & decode image
            res = requests.get(s3_url, timeout=10)
            img = cv2.imdecode(np.frombuffer(res.content, np.uint8), cv2.IMREAD_COLOR)

            # InsightFace extraction
            faces = app.get(img)
            logging.info(f"Detected {len(faces)} face(s)")

            for face in faces:
                # L2 normalize vector for cosine distance searching
                norm_vec = (face.embedding / np.linalg.norm(face.embedding)).tolist()
                save_embedding(photo_id, event_id, norm_vec)

        except Exception as err:
            logging.error(f"Worker Error: {err}")
            time.sleep(1)

if __name__ == "__main__":
    start_worker()