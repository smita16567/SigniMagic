from flask import Flask, request, jsonify
from flask_cors import CORS
from database import init_db, save
import numpy as np
from tensorflow.keras.models import load_model

app = Flask(__name__)
CORS(app)

# Load trained model
model = load_model("model.keras")

# Labels (MUST match training)
labels = [
    "Hello","Thank You","Sorry","Please","Yes","No","Help","Stop","Come","Go",
    "Eat","Drink","Water","Food","Hungry","Thirsty","Good","Bad","Happy","Sad",
    "Angry","Sleep","Wake","School","Teacher","Student","Book","Pen","Write","Read",
    "Home","Mother","Father","Brother","Sister","Friend","Doctor","Hospital","Medicine","Pain",
    "Time","Today","Tomorrow","Morning","Night","Where","What","Who","Why","How"
]

init_db()

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()

        if not data or 'landmarks' not in data:
            return jsonify({"error": "No landmarks received"}), 400

        landmarks = data['landmarks']

        if len(landmarks) != 21:
            return jsonify({"error": "Invalid landmarks"}), 400

        flat = []
        for p in landmarks:
            flat.extend([p['x'], p['y']])

        input_data = np.array(flat).reshape(1, -1)

        prediction = model.predict(input_data)
        class_id = int(np.argmax(prediction))

        result = labels[class_id]

        save(result)

        return jsonify({"prediction": result})

    except Exception as e:
        print("ERROR:", e)  # 🔥 IMPORTANT (see terminal)
        return jsonify({"error": str(e)}), 500