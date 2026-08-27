import base64
import cv2
import numpy as np
from flask import Flask, request, jsonify
from insightface.app import FaceAnalysis

app = Flask(__name__)
face_app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
face_app.prepare(ctx_id=0, det_size=(640,640))

@app.route("/embed", methods=["POST"])
def embed():
    try:
        data = request.json.get("image", "")
        if "," in data:
            data = data.split(",")[1]
        
        img_bytes = base64.b64decode(data)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        faces = face_app.get(img)
        if not faces:
            return jsonify({"error": "No face found"}), 400

        # Primary face L2-normalized 512-D vector
        norm_vec = (faces[0].embedding / np.linalg.norm(faces[0].embedding)).tolist()
        return jsonify({"vector": norm_vec})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    print("🚀 Python Selfie Embedder running on http://localhost:5001")
    app.run(port=5001)