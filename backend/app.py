from flask import Flask, request, jsonify
from src.file_classifier import classify_file
from src.extract_data import extract_data
from io import BytesIO
import pandas as pd

app = Flask(__name__)

@app.route('/api/upload', methods=['POST'])
def upload_file():
    uploaded_file = request.files['file']
    file_bytes = uploaded_file.read()

    debug_logs = {}

    # Test reading Excel file explicitly
    try:
        xl = pd.ExcelFile(BytesIO(file_bytes))
        debug_logs['sheets'] = xl.sheet_names
    except Exception as e:
        debug_logs['excel_read_error'] = str(e)
        return jsonify({"error": "Excel read failed", "debug_logs": debug_logs}), 400

    # Run classification with explicit debugging
    try:
        classification_result = classify_file(BytesIO(file_bytes))
    except Exception as e:
        classification_result = {
            "is_inventory_planning": False,
            "confidence": 0.0,
            "justification": f"Classifier error: {str(e)}"
        }

    classification_result = {
        "is_inventory_planning": classification_result.get("is_inventory_planning", False),
        "confidence": float(classification_result.get("confidence", 0.0)) if classification_result.get("confidence") else 0.0,
        "justification": classification_result.get("justification", "No justification available.")
    }

    # Run extraction with explicit debugging
    try:
        extracted_data = extract_data(BytesIO(file_bytes))
    except Exception as e:
        extracted_data = {"error": f"Extraction error: {str(e)}"}

    return jsonify({
        "classification": classification_result,
        "extracted_data": extracted_data,
        "debug_logs": debug_logs
    })

if __name__ == '__main__':
    app.run(debug=True)
