from flask import Flask, request, jsonify
from src.file_classifier import classify_file

app = Flask(__name__)

@app.route('/api/upload', methods=['POST'])
def upload_file():
    uploaded_file = request.files['file']
    result = classify_file(uploaded_file)
    return jsonify(result)

if __name__ == '__main__':
    # In production, consider using a production server like Gunicorn
    app.run(debug=True)
