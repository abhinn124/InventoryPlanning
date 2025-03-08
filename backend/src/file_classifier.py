import pandas as pd
import warnings
from fuzzywuzzy import fuzz

warnings.filterwarnings("ignore", category=UserWarning, module="openpyxl")

# Mapping for expected sheets into categories
SHEET_MAPPINGS = {
    "inventory_on_hand": ["inventory snapshot", "stock summary", "on-hand inventory", "current stock"],
    "sales_history": ["sales data", "revenue report", "orders", "sales records", "depletions", "sales"],
    "purchase_orders": ["purchase orders", "po summary", "incoming stock", "replen orders"],
    "item_master": ["item master", "product catalog", "product details", "sku list"]
}

# Define expected column variations
COLUMN_MAPPINGS = {
    "sku": ["sku", "product code", "item id", "stock keeping unit"],
    "quantity": ["quantity", "qty", "stock count", "inventory level"],
    "location": ["location", "warehouse", "store"],
    "purchase_order_id": ["purchase order id", "po id", "order number"],
    "arrival_date": ["arrival date", "expected delivery", "eta"],
    "cost": ["cost", "unit cost", "purchase price"],
    "order_date": ["order date", "order placed"],
    "vendor": ["vendor", "supplier", "manufacturer"],
    "revenue": ["revenue", "sales value", "total sales"],
    "channel": ["channel", "sales channel", "platform"]
}

def fuzzy_match(target, candidates, threshold=80):
    """ Match a target string against a list of candidates using fuzzy matching. """
    for candidate in candidates:
        if fuzz.partial_ratio(target.lower(), candidate.lower()) >= threshold:
            return True
    return False

def classify_file(file):
    """
    Takes the uploaded file and performs:
      - Sheet recognition (stronger signals)
      - Column classification (more precise mapping)
      - Revised confidence scoring
    """
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
    detected_categories = {key: False for key in SHEET_MAPPINGS.keys()}

    # Sheet recognition - Stronger weighting
    for sheet in sheets:
        for category, variations in SHEET_MAPPINGS.items():
            if fuzzy_match(sheet, variations):
                detected_categories[category] = True
                justification_parts.append(f'Sheet "{sheet}" identified as "{category}".')

    # Column recognition - Check required fields
    column_signals = 0
    for sheet in sheets:
        try:
            df = xl.parse(sheet, nrows=5)  # Read only the first few rows to speed up processing
            columns_lower = [str(c).lower() for c in df.columns]

            matched_columns = 0
            for field, variations in COLUMN_MAPPINGS.items():
                if any(fuzzy_match(col, variations) for col in columns_lower):
                    matched_columns += 1
            
            if matched_columns >= 2:  # Require at least two key fields to count
                column_signals += 1
                justification_parts.append(f'Sheet "{sheet}" contains multiple key fields.')

        except Exception as e:
            justification_parts.append(f'Error reading sheet "{sheet}": {str(e)}')

    # Improved Confidence Scoring
    detected_categories_count = sum(detected_categories.values())
    confidence = (column_signals * 1.5 + detected_categories_count * 3) / (len(sheets) + 3)

    is_inventory_planning = confidence > 0.5  # Adjust threshold as needed

    justification = ' '.join(justification_parts) if justification_parts else 'No significant matches found.'

    return {
        'is_inventory_planning': is_inventory_planning,
        'confidence': round(confidence, 2),
        'justification': justification
    }
