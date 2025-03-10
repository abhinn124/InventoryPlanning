# backend/app.py
from flask import Flask, request, jsonify
from src.file_classifier import classify_file
from src.extract_data import extract_data
from src.errors import *
from io import BytesIO
import pandas as pd

app = Flask(__name__)

# File size limit (20MB)
MAX_FILE_SIZE = 20 * 1024 * 1024

@app.route('/api/upload', methods=['POST'])
def upload_file():
    try:
        # Validate request has file
        if 'file' not in request.files:
            return jsonify({
                "error": "No file provided",
                "error_type": "missing_file",
                "suggestions": ["Please select a file before uploading"]
            }), 400
            
        uploaded_file = request.files['file']
        
        # Validate file name
        if uploaded_file.filename == '':
            return jsonify({
                "error": "Empty file name",
                "error_type": "invalid_file",
                "suggestions": ["Please select a file before uploading"]
            }), 400
            
        # Validate file extension
        if not uploaded_file.filename.endswith(('.xlsx', '.xls', '.csv')):
            return jsonify({
                "error": "Invalid file type",
                "error_type": "invalid_file_type",
                "suggestions": ["Please upload an Excel file (.xlsx, .xls) or CSV file"]
            }), 400
            
        # Check file size
        file_bytes = uploaded_file.read()
        if len(file_bytes) > MAX_FILE_SIZE:
            return jsonify({
                "error": "File too large",
                "error_type": "file_too_large",
                "suggestions": ["Please upload a file smaller than 10MB", 
                               "Consider splitting large workbooks into smaller ones"]
            }), 400
            
        # Initialize debug logs
        debug_logs = {}

        # Verify file integrity
        try:
            if uploaded_file.filename.endswith('.csv'):
                # Handle CSV files
                df = pd.read_csv(BytesIO(file_bytes), nrows=5)
                debug_logs['file_type'] = 'csv'
            else:
                # Handle Excel files
                xl = pd.ExcelFile(BytesIO(file_bytes))
                sheet_names = xl.sheet_names
                if not sheet_names:
                    raise EmptyFileError("Excel file has no sheets")
                debug_logs['sheets'] = sheet_names
                debug_logs['file_type'] = 'excel'
        except EmptyFileError as e:
            return jsonify({
                "error": str(e),
                "error_type": "empty_file",
                "suggestions": ["Please upload a file with data sheets"]
            }), 400
        except Exception as e:
            raise InvalidFileTypeError(f"Could not read file: {str(e)}")

        # Classify the file and extract data
        try:
            classification_result = classify_file(BytesIO(file_bytes))
            business_type = classification_result.get("business_type", "generic")
            
            # Pass the detected business type into the extraction function
            extracted_data = extract_data(BytesIO(file_bytes), business_type=business_type)
            
            # Check if we have any successful extractions
            has_data = any(len(extracted_data.get(category, [])) > 0 
                          for category in ['inventory_on_hand', 'sales_history', 
                                          'purchase_orders', 'item_master'])
            
            if not has_data and classification_result.get("is_inventory_planning", False):
                debug_logs['extraction_warning'] = "File classified as inventory planning but no data extracted"
                
        except FileReadError as e:
            return jsonify({
                "error": str(e),
                "error_type": "file_read_error",
                "details": e.details,
                "suggestions": ["Check if the file is password protected", 
                               "Ensure the file is not corrupted"]
            }), 400
        except DataExtractionError as e:
            # Return partial results with error info
            return jsonify({
                "classification": classification_result,
                "extracted_data": {},
                "error": str(e),
                "error_type": "extraction_error",
                "details": e.details,
                "suggestions": ["Try simplifying the workbook structure", 
                               "Ensure data is in a tabular format"]
            }), 200
        except Exception as e:
            raise DataExtractionError(f"Unexpected error during processing: {str(e)}")

        # Return success response
        return jsonify({
            "classification": classification_result,
            "extracted_data": extracted_data,
            "debug_logs": debug_logs
        })
        
    except InvalidFileTypeError as e:
        return jsonify({
            "error": str(e),
            "error_type": "invalid_file_type",
            "suggestions": ["Make sure the file is a valid Excel or CSV file",
                           "Try resaving the file in a different Excel format"]
        }), 400
    except FileSizeLimitError as e:
        return jsonify({
            "error": str(e),
            "error_type": "file_too_large",
            "suggestions": ["Please upload a file smaller than 10MB"]
        }), 400
    except DataExtractionError as e:
        return jsonify({
            "error": str(e),
            "error_type": "extraction_error",
            "details": e.details if hasattr(e, 'details') else {},
            "suggestions": ["Check the file format", "Ensure data is in a tabular format"]
        }), 500
    except Exception as e:
        # Catch-all for unexpected errors
        return jsonify({
            "error": f"An unexpected error occurred: {str(e)}",
            "error_type": "unexpected_error",
            "suggestions": ["Try a different file", "Contact support if the problem persists"]
        }), 500

if __name__ == '__main__':
    app.run(debug=True)