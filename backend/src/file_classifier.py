import pandas as pd
import warnings

warnings.filterwarnings("ignore", category=UserWarning, module="openpyxl")

def classify_file(file):
    """
    Takes the uploaded file and performs:
      - Basic checks if it's an Excel file
      - Attempts to parse for 'inventory planning' signals
      - Returns { 'is_inventory_planning': bool, 'confidence': float, 'justification': str }
    """
    # Attempt to parse the Excel file
    try:
        xl = pd.ExcelFile(file)
        sheets = xl.sheet_names
    except Exception as e:
        return {
            'is_inventory_planning': False,
            'confidence': 0.0,
            'justification': f'File read error: {str(e)}'
        }

    signals = 0
    justification_parts = []

    # Check each sheet in the workbook
    for sheet in sheets:
        df = xl.parse(sheet)

        # Convert column names to strings and lowercase them
        columns_lower = [str(c).lower() for c in df.columns]

        # Look for typical inventory-planning columns
        if any('sku' in c for c in columns_lower):
            signals += 1
            justification_parts.append(f'Sheet "{sheet}" has a column containing "SKU".')
        if any('quantity' in c for c in columns_lower):
            signals += 1
            justification_parts.append(f'Sheet "{sheet}" has a column containing "Quantity".')
        if 'purchase order id' in columns_lower:
            signals += 1
            justification_parts.append(f'Sheet "{sheet}" references "Purchase Order ID".')

    # Compute a simplistic confidence metric (for demo purposes)
    confidence = float(signals) / (len(sheets) + 1)

    # Decide if it's an inventory planning file based on our threshold
    is_inventory_planning = confidence > 0.4

    # Construct a justification string
    justification = ' '.join(justification_parts) if justification_parts else 'No typical columns found.'

    return {
        'is_inventory_planning': is_inventory_planning,
        'confidence': round(confidence, 2),
        'justification': justification
    }
