import pandas as pd
import warnings
from fuzzywuzzy import fuzz

warnings.filterwarnings("ignore", category=UserWarning, module="openpyxl")

FIELD_MAPPINGS = {
    "sku": ["sku", "product code", "item id", "stock keeping unit"],
    "quantity": ["quantity", "qty", "stock count", "inventory level"],
    "location": ["location", "warehouse", "store", "dc"],
    "time_period": ["date", "time period", "month", "week", "year"],
    "revenue": ["revenue", "sales value", "total sales"],
    "channel": ["channel", "sales channel", "platform"],
    "purchase_order_id": ["purchase order id", "po id", "order number"],
    "arrival_date": ["arrival date", "expected delivery", "eta"],
    "cost": ["cost", "unit cost", "purchase price"],
    "order_date": ["order date", "order placed"],
    "vendor": ["vendor", "supplier", "manufacturer"],
    "price": ["price", "unit price", "selling price"],
    "category": ["category", "product category", "item type"]
}

SHEET_CATEGORIES = {
    "inventory_on_hand": ["inventory snapshot", "stock summary", "on-hand inventory", "current stock"],
    "sales_history": ["sales data", "revenue report", "orders", "sales records", "depletions"],
    "purchase_orders": ["purchase orders", "po summary", "incoming stock", "replen orders"],
    "item_master": ["item master", "product catalog", "product details", "sku list"]
}

def fuzzy_match(target, candidates, threshold=85):
    """ Match a target string against a list of candidates using fuzzy matching. """
    for candidate in candidates:
        if fuzz.partial_ratio(target.lower(), candidate.lower()) >= threshold:
            return candidate
    return None

def ensure_unique_columns(columns):
    """ Ensures all column names are unique, handling unnamed columns properly. """
    seen = {}
    unique_columns = []
    for idx, col in enumerate(columns):
        col = str(col).strip().lower()
        if col.startswith('unnamed') or not col:
            col = f'unnamed_{idx+1}'
        if col in seen:
            seen[col] += 1
            col = f"{col}_{seen[col]}"
        else:
            seen[col] = 0
        unique_columns.append(col)
    return unique_columns

def extract_data(file):
    """ Extracts structured data from the workbook while filtering out invalid rows. """
    try:
        xl = pd.ExcelFile(file)
    except Exception as e:
        return {"error": f"File read error: {str(e)}"}

    extracted_data = {
        "inventory_on_hand": [],
        "sales_history": [],
        "purchase_orders": [],
        "item_master": [],
        "unclassified": []
    }

    for sheet in xl.sheet_names:
        try:
            df = xl.parse(sheet, nrows=20)
            if df.empty:
                continue

            df.columns = ensure_unique_columns(df.columns)

            sheet_category = "unclassified"
            for category, variations in SHEET_CATEGORIES.items():
                if fuzzy_match(sheet, variations):
                    sheet_category = category
                    break

            if not sheet_category:
                sheet_category = "unclassified"

            field_map = {}
            matched_fields = set()
            for col in df.columns:
                for field, variations in FIELD_MAPPINGS.items():
                    if field not in matched_fields and fuzzy_match(col, variations):
                        field_map[col] = field
                        matched_fields.add(field)
                        break

            if not field_map:
                continue

            extracted_rows = df[list(field_map.keys())].rename(columns=field_map)

            # Remove header rows mistakenly extracted as data
            for field in ["sku", "quantity", "time_period"]:
                if field in extracted_rows.columns:
                    extracted_rows = extracted_rows[
                        ~extracted_rows[field].astype(str).str.lower().isin(FIELD_MAPPINGS[field])
                    ]

            # Convert numeric fields explicitly
            numeric_fields = ["quantity", "revenue", "cost", "price"]
            for field in numeric_fields:
                if field in extracted_rows.columns:
                    extracted_rows[field] = pd.to_numeric(extracted_rows[field], errors='coerce')

            # Convert dates properly with an explicit format
            date_fields = ["time_period", "order_date", "arrival_date"]
            for field in date_fields:
                if field in extracted_rows.columns:
                    extracted_rows[field] = pd.to_datetime(
                        extracted_rows[field], format="%Y-%m-%d", errors='coerce'
                    )

            # Drop rows with all NaNs
            extracted_rows.dropna(how='all', inplace=True)

            # Keep only rows with at least half valid values
            threshold = len(extracted_rows.columns) // 2
            extracted_rows = extracted_rows.dropna(thresh=threshold)

            # Convert cleaned records
            records = extracted_rows.to_dict(orient="records")
            clean_records = [{k: v for k, v in record.items() if pd.notna(v)} for record in records]

            if clean_records:
                extracted_data[sheet_category].extend(clean_records)

        except Exception as e:
            print(f"Error processing sheet '{sheet}': {e}")

    return extracted_data
