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

    # 1) First, try reading the Excel file to confirm it loads
    try:
        xl = pd.ExcelFile(BytesIO(file_bytes))
        debug_logs['sheets'] = xl.sheet_names
    except Exception as e:
        debug_logs['excel_read_error'] = str(e)
        return jsonify({"error": "Excel read failed", "debug_logs": debug_logs}), 400

    # 2) Next, classify the file and extract data using your snippet
    try:
        classification_result = classify_file(BytesIO(file_bytes))
        business_type = classification_result.get("business_type", "generic")
        
        # Pass the detected business type into the extraction function
        extracted_data = extract_data(BytesIO(file_bytes), business_type=business_type)
    except Exception as e:
        classification_result = {
            "is_inventory_planning": False,
            "confidence": 0.0,
            "justification": f"Classifier error: {str(e)}"
        }
        extracted_data = {"error": f"Extraction error: {str(e)}"}

    # 3) Return everything as JSON
    return jsonify({
        "classification": classification_result,
        "extracted_data": extracted_data,
        "debug_logs": debug_logs
    })

if __name__ == '__main__':
    app.run(debug=True)
