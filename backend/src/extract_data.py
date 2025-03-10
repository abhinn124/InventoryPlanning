import pandas as pd
import numpy as np
import warnings
import re
from datetime import datetime
from fuzzywuzzy import fuzz, process
from collections import defaultdict

warnings.filterwarnings("ignore", category=UserWarning, module="openpyxl")

# Sheet mappings for classifying sheets into categories
SHEET_MAPPINGS = {
    # Generic mappings that apply to all business types
    "generic": {
        "inventory_on_hand": [
            "inventory snapshot", "stock summary", "on-hand inventory", "current stock", 
            "current inventory", "inventory", "total inventory", "inventory summary",
            "inventory on hand", "stock", "on hand", "warehouse inventory"
        ],
        "sales_history": [
            "sales data", "revenue report", "orders", "sales records", "depletions", "sales",
            "sales history", "order history", "revenue", "sales report", "historical sales",
            "sales by sku", "order data", "shipping data"
        ],
        "purchase_orders": [
            "purchase orders", "po summary", "incoming stock", "replen orders", "po",
            "orders", "procurement", "inbound", "pending orders", "arrivals",
            "po tracking", "inventory receipts", "receiving"
        ],
        "item_master": [
            "item master", "product catalog", "product details", "sku list", "products",
            "items", "product data", "product master", "item list", "product information",
            "sku details", "item details", "product inventory"
        ]
    },
    
    # Retail/fashion specific mappings 
    "retail": {
        "inventory_on_hand": [
            "shipmonk", "outerspace", "warehouse", "dc inventory", "stock levels",
            "category inventory", "distribution center", "total inventory", "inventory by category"
        ],
        "sales_history": [
            "sku sales data", "category sales", "watches sales", "jewelry sales", 
            "eyewear sales", "straps sales", "orders shipped", "wow sales projections",
            "sales by channel", "returns"
        ],
        "purchase_orders": [
            "order sheet", "os receivings report", "inbound receipts", "wip", "arrivals", 
            "shipments", "po tracking", "supplier orders", "vendor orders"
        ],
        "item_master": [
            "product", "product data", "watches master", "jewelry master", "product master", 
            "product category", "sku master", "product catalog", "item attribute", "carry master",
            "eyewear master"
        ]
    },
    
    # Food/CPG specific mappings
    "food_cpg": {
        "inventory_on_hand": [
            "inventory snapshot", "inventory detail", "dot inventory", "current inventory",
            "warehouse stock", "comarco stock", "lineage", "inventory monthly", "owned inventory"
        ],
        "sales_history": [
            "delivery by month", "delivery by customer", "production and delivery",
            "customer delivery", "shipments", "sales by location", "order volume", "order data"
        ],
        "purchase_orders": [
            "production by month", "production", "true up template", "invoice tracker",
            "supplier orders", "manufacturing plan", "production schedule"
        ],
        "item_master": [
            "item list", "product codes", "sku detail", "products", "product description",
            "product master", "code list", "case pack data", "product specs"
        ]
    },
    
    # Distribution/Supply Chain specific mappings
    "distribution": {
        "inventory_on_hand": [
            "dc inventory", "total inventory", "warehouse", "inventory by location",
            "stock by sku", "stock levels", "inventory variance", "inv variance", "on hand"
        ],
        "sales_history": [
            "sku depletions", "orders shipped", "order history", "sales forecast",
            "rolling sales forecast", "take rate per sku", "share by sku", "sales by dc"
        ],
        "purchase_orders": [
            "inbound receipts", "replen orders", "replen tool", "supply forecast",
            "incoming shipments", "vendor orders", "arrival schedule"
        ],
        "item_master": [
            "sku list", "product data", "cost", "cogs", "product catalog", "item detail",
            "product master", "product specs", "item attributes"
        ]
    }
}

# Define expected schemas for each data category
EXTRACTION_SCHEMAS = {
    "inventory_on_hand": {
        "sku": {"required": True, "type": "str", "validation": "alphanumeric"},
        "quantity": {"required": True, "type": "float", "validation": "positive_numeric"},
        "location": {"required": False, "type": "str", "validation": "text"}
    },
    "sales_history": {
        "sku": {"required": True, "type": "str", "validation": "alphanumeric"},
        "time_period": {"required": True, "type": "datetime", "validation": "date"},
        "quantity": {"required": True, "type": "float", "validation": "numeric"},
        "location": {"required": False, "type": "str", "validation": "text"},
        "revenue": {"required": False, "type": "float", "validation": "numeric"},
        "channel": {"required": False, "type": "str", "validation": "text"}
    },
    "purchase_orders": {
        "purchase_order_id": {"required": True, "type": "str", "validation": "alphanumeric"},
        "sku": {"required": True, "type": "str", "validation": "alphanumeric"},
        "quantity": {"required": True, "type": "float", "validation": "positive_numeric"},
        "arrival_date": {"required": True, "type": "datetime", "validation": "date"},
        "cost": {"required": False, "type": "float", "validation": "numeric"},
        "order_date": {"required": False, "type": "datetime", "validation": "date"},
        "vendor": {"required": False, "type": "str", "validation": "text"},
        "location": {"required": False, "type": "str", "validation": "text"},
        "has_arrived": {"required": False, "type": "bool", "validation": "boolean"}
    },
    "item_master": {
        "sku": {"required": True, "type": "str", "validation": "alphanumeric"},
        "category": {"required": False, "type": "str", "validation": "text"},
        "vendor": {"required": False, "type": "str", "validation": "text"},
        "price": {"required": False, "type": "float", "validation": "numeric"},
        "cost": {"required": False, "type": "float", "validation": "numeric"}
    }
}

# Enhanced field mappings with business-type specificity
FIELD_MAPPINGS = {
    # Generic mappings that apply to all business types
    "generic": {
        "sku": ["sku", "product code", "item id", "stock keeping unit", "item code", "product", 
                "product id", "item number", "part number", "material number", "sku code", 
                "product number", "variant id", "item", "upc", "product sku"],
        "quantity": ["quantity", "qty", "stock count", "inventory level", "on hand", 
                    "available", "stock", "inventory", "in stock", "units", "on-hand",
                    "qty on hand", "physical qty", "inventory on hand", "available quantity",
                    "total qty", "cases", "pallets", "units", "inventory value", "count"],
        "location": ["location", "warehouse", "store", "dc", "site", "facility", "storage location",
                    "bin", "branch", "distribution center", "storage", "inventory location",
                    "warehouse location", "destination", "origin", "location name", "facility"],
        "time_period": ["date", "time period", "month", "week", "year", "period", "sales date", 
                        "order date", "transaction date", "ship date", "sales period", 
                        "order period", "fiscal period", "date range", "day", "quarter"],
        "revenue": ["revenue", "sales value", "total sales", "sales amount", "gross sales", 
                    "sales revenue", "net sales", "sales total", "amount", "order value", 
                    "transaction value", "gross revenue", "total value", "total revenue"],
        "channel": ["channel", "sales channel", "platform", "marketplace", "store type", 
                    "sales source", "outlet", "point of sale", "pos", "sales medium", 
                    "sales location", "customer type", "order type", "order source"],
        "purchase_order_id": ["purchase order id", "po id", "order number", "po number", "po #", 
                            "purchase order", "order id", "po reference", "po no", "po num", 
                            "po", "order #", "reference number", "order reference", "po name"],
        "arrival_date": ["arrival date", "expected delivery", "eta", "delivery date", 
                        "due date", "expected arrival", "receipt date", "promised date", 
                        "expected receipt", "arrival date", "delivery", "ship by", "ship date",
                        "planned arrival date", "pickup date"],
        "cost": ["cost", "unit cost", "purchase price", "item cost", "po cost", 
                "invoice cost", "order cost", "product cost", "buying cost", 
                "acquisition cost", "landed cost", "cost price", "purchase cost",
                "invoice $ per case", "price per unit", "cogs"],
        "order_date": ["order date", "order placed", "date ordered", "po date", "issue date", 
                    "creation date", "placed date", "purchase date", "ordering date", 
                    "submitted date", "created date", "po created", "order created"],
        "vendor": ["vendor", "supplier", "manufacturer", "seller", "vendor name", 
                "supplier name", "manufacturer name", "company", "vendor id", 
                "supplier id", "provider", "source", "partner", "procurement source",
                "transport", "carrier"],
        "has_arrived": ["has arrived", "arrived", "received", "status", "receipt status", 
                    "delivery status", "arrival status", "receipt confirmed", "in stock", 
                    "arrived status", "received status", "status code", "reception status"],
        "price": ["price", "unit price", "selling price", "retail price", "msrp", 
                "list price", "sales price", "item price", "product price", 
                "standard price", "base price", "rrp", "market price", "purchase price"],
        "category": ["category", "product category", "item type", "product type", 
                    "department", "class", "group", "product group", "merchandise group", 
                    "item category", "product class", "merchandise category", "category name",
                    "collection", "hierarchy", "product family"]
    },
    
    # Retail/fashion specific mappings 
    "retail": {
        "sku": ["sku", "variant_sku", "variant sku", "product sku", "product code", "style number", "style code"],
        "quantity": ["available", "in stock", "on hand", "physical quantity", "inventory value"],
        "location": ["warehouse", "store", "dc", "fulfillment center", "storage"],
        "time_period": ["month", "date", "period", "week", "quarter", "year", "season"],
        "category": ["collection", "category", "product type", "style", "department"]
    },
    
    # Food/CPG specific mappings
    "food_cpg": {
        "sku": ["item code", "product code", "upc", "gtin", "product code"],
        "quantity": ["cases", "pallets", "units", "eaches", "case quantity", "physical inventory"],
        "location": ["facility", "warehouse", "dc", "lineage", "distribution center"],
        "time_period": ["production date", "expiration date", "best by", "manufacture date"],
        "category": ["product type", "category", "product family"]
    },
    
    # Distribution/Supply Chain specific mappings 
    "distribution": {
        "sku": ["smart sku id", "item code", "product", "sku code", "item number"],
        "quantity": ["on hand (actl)", "available", "on hand", "qty", "inventory on hand"],
        "location": ["dc", "warehouse", "storage location", "fulfillment center"],
        "time_period": ["week", "weeknum", "week tue", "fiscal week", "period"],
        "category": ["product group", "category", "class", "department"]
    }
}

# Definition for how to detect and convert various date formats
DATE_FORMAT_PATTERNS = [
    # Standard date formats
    {"pattern": r"^\d{4}-\d{1,2}-\d{1,2}$", "format": "%Y-%m-%d"},  # YYYY-MM-DD
    {"pattern": r"^\d{1,2}/\d{1,2}/\d{4}$", "format": "%m/%d/%Y"},  # MM/DD/YYYY
    {"pattern": r"^\d{1,2}/\d{1,2}/\d{2}$", "format": "%m/%d/%y"},  # MM/DD/YY
    {"pattern": r"^\d{1,2}-\d{1,2}-\d{4}$", "format": "%m-%d-%Y"},  # MM-DD-YYYY
    {"pattern": r"^\d{1,2}-\d{1,2}-\d{2}$", "format": "%m-%d-%y"},  # MM-DD-YY
    {"pattern": r"^\d{4}/\d{1,2}/\d{1,2}$", "format": "%Y/%m/%d"},  # YYYY/MM/DD
    
    # Month name formats
    {"pattern": r"^\d{1,2}\s[A-Za-z]{3,9}\s\d{4}$", "format": "%d %B %Y"},  # DD Month YYYY
    {"pattern": r"^[A-Za-z]{3,9}\s\d{1,2},?\s\d{4}$", "format": "%B %d, %Y"},  # Month DD, YYYY
    
    # Fiscal periods
    {"pattern": r"^Q[1-4]\s\d{4}$", "format": None, "handler": "fiscal_quarter"},  # Q1 2023
    {"pattern": r"^[A-Za-z]{3,9}\s\d{4}$", "format": "%B %Y"},  # Month YYYY
    
    # Week-based formats
    {"pattern": r"^Week\s\d{1,2}$", "format": None, "handler": "week_number"},  # Week 12
    {"pattern": r"^WK\s\d{1,2}$", "format": None, "handler": "week_number"},  # WK 12
]

def fuzzy_match(target, candidates, threshold=85):
    """
    Enhanced fuzzy matching with improved matching algorithm and threshold handling.
    Returns the match and the match score.
    """
    if not target or not isinstance(target, str):
        return None, 0
    
    target = str(target).strip().lower()
    if not target or target == 'nan':
        return None, 0
        
    best_match = None
    best_score = 0
    
    for candidate in candidates:
        # Try multiple scoring methods for more accurate matching
        ratio_score = fuzz.ratio(target, candidate.lower())
        partial_score = fuzz.partial_ratio(target, candidate.lower())
        token_sort_score = fuzz.token_sort_ratio(target, candidate.lower())
        
        # Use the best score among the different methods
        score = max(ratio_score, partial_score, token_sort_score)
        
        if score > best_score and score >= threshold:
            best_score = score
            best_match = candidate
    
    return best_match, best_score

def get_field_mappings(business_type):
    """
    Get field mappings specific to the business type, combining with generic mappings.
    """
    mappings = {}
    
    # Start with generic mappings
    for field, variations in FIELD_MAPPINGS["generic"].items():
        mappings[field] = variations.copy()
    
    # Add business-specific mappings if available
    if business_type in FIELD_MAPPINGS:
        for field, variations in FIELD_MAPPINGS[business_type].items():
            if field in mappings:
                # Add any new variations that aren't already in the list
                existing_variations = set(v.lower() for v in mappings[field])
                for variation in variations:
                    if variation.lower() not in existing_variations:
                        mappings[field].append(variation)
            else:
                mappings[field] = variations.copy()
    
    return mappings

def detect_sheet_category(sheet_name, business_type):
    """
    Determine the most likely category for a sheet based on its name and business type.
    """
    # Get generic and business-specific mappings from local SHEET_MAPPINGS
    category_mappings = {}
    for category, variations in SHEET_MAPPINGS["generic"].items():
        category_mappings[category] = variations.copy()
    
    # Add business-specific mappings if available
    if business_type in SHEET_MAPPINGS:
        for category, variations in SHEET_MAPPINGS[business_type].items():
            if category in category_mappings:
                category_mappings[category].extend(variations)
            else:
                category_mappings[category] = variations.copy()
    
    # Find the best match
    best_category = None
    best_score = 0
    
    for category, variations in category_mappings.items():
        match, score = fuzzy_match(sheet_name, variations)
        if match and score > best_score:
            best_score = score
            best_category = category
    
    # If no good match found, return 'unclassified'
    return best_category if best_score >= 75 else "unclassified"

def ensure_unique_columns(columns):
    """
    Ensures all column names are unique, handling unnamed columns properly.
    """
    seen = {}
    unique_columns = []
    for idx, col in enumerate(columns):
        col = str(col).strip().lower()
        if col.startswith('unnamed') or not col or pd.isna(col):
            col = f'unnamed_{idx+1}'
        if col in seen:
            seen[col] += 1
            col = f"{col}_{seen[col]}"
        else:
            seen[col] = 0
        unique_columns.append(col)
    return unique_columns

def identify_header_row(df, required_fields, field_mappings):
    """
    Identifies the most likely header row in a dataframe by looking for matches
    to required field names.
    """
    # Check first 10 rows at most
    max_check_rows = min(10, len(df))
    best_score = 0
    best_row = 0
    
    # Prepare all field variations to check against
    all_variations = []
    for field in required_fields:
        all_variations.extend(field_mappings[field])
    
    for row_idx in range(max_check_rows):
        row_values = df.iloc[row_idx].astype(str).str.lower().tolist()
        match_count = 0
        
        for val in row_values:
            for var in all_variations:
                if fuzz.ratio(val, var.lower()) >= 80:
                    match_count += 1
                    break
        
        if match_count > best_score:
            best_score = match_count
            best_row = row_idx
    
    return best_row if best_score >= 2 else 0  # Return 0 if no good match

def parse_date_value(value):
    """
    Attempts to parse a date value using multiple formats and patterns.
    Returns a datetime object if successful, None otherwise.
    """
    if pd.isna(value):
        return None
        
    # If already a datetime, return as is
    if isinstance(value, (datetime, pd.Timestamp)):
        return value
    
    # Convert to string for parsing
    value_str = str(value).strip()
    
    # Handle Excel serial date numbers
    if value_str.isdigit() or (value_str.replace('.', '', 1).isdigit() and value_str.count('.') <= 1):
        try:
            # Excel dates are number of days since 1899-12-30 (or 1904-01-01 for Mac)
            # Try to parse as Excel date
            return pd.to_datetime('1899-12-30') + pd.Timedelta(days=float(value_str))
        except:
            pass
    
    # Try each date pattern
    for pattern_info in DATE_FORMAT_PATTERNS:
        if re.match(pattern_info["pattern"], value_str):
            if "format" in pattern_info and pattern_info["format"]:
                try:
                    return datetime.strptime(value_str, pattern_info["format"])
                except:
                    pass
            elif "handler" in pattern_info:
                if pattern_info["handler"] == "fiscal_quarter":
                    # Handle fiscal quarter format (Q1 2023)
                    match = re.match(r"Q(\d{1})\s(\d{4})", value_str)
                    if match:
                        quarter = int(match.group(1))
                        year = int(match.group(2))
                        month = (quarter - 1) * 3 + 1  # Q1->1, Q2->4, Q3->7, Q4->10
                        return datetime(year, month, 1)
                elif pattern_info["handler"] == "week_number":
                    # Handle week number format (Week 12)
                    match = re.match(r"(?:Week|WK)\s(\d{1,2})", value_str)
                    if match:
                        week = int(match.group(1))
                        # Use the current year as a default
                        return datetime.now().replace(month=1, day=1) + pd.Timedelta(weeks=week-1)
    
    # Try pandas to_datetime as a fallback
    try:
        return pd.to_datetime(value)
    except:
        return None

def validate_and_convert_value(value, field_schema):
    """
    Validates and converts a value based on its expected type and validation rules.
    Returns the converted value if valid, None otherwise.
    """
    if pd.isna(value):
        return None
    
    field_type = field_schema["type"]
    validation = field_schema["validation"]
    
    # Convert based on expected type
    if field_type == "str":
        value = str(value).strip()
        
        # Validate alphanumeric
        if validation == "alphanumeric":
            # Allow alphanumeric plus common separators
            if not re.match(r'^[A-Za-z0-9\-_\.\/\s]+$', value):
                return None
        
        return value
    
    elif field_type == "float":
        # Try to convert to float
        try:
            float_val = float(value)
            
            # Validate numeric constraints
            if validation == "positive_numeric" and float_val < 0:
                return None
                
            return float_val
        except:
            return None
    
    elif field_type == "datetime":
        return parse_date_value(value)
    
    elif field_type == "bool":
        # Handle various boolean representations
        if isinstance(value, bool):
            return value
        elif isinstance(value, (int, float)):
            return value != 0
        elif isinstance(value, str):
            value = value.lower().strip()
            if value in ('yes', 'true', '1', 't', 'y'):
                return True
            elif value in ('no', 'false', '0', 'f', 'n'):
                return False
        return None
    
    # Default case
    return value

def detect_column_data_types(df, sample_rows=100):
    """
    Analyzes a dataframe to determine the most likely data type for each column.
    Returns a dictionary of column names mapped to likely data types.
    """
    # How many rows to sample (max)
    sample_size = min(sample_rows, len(df))
    sample_df = df.head(sample_size)
    
    column_types = {}
    
    for col in df.columns:
        # Skip columns with no name
        if not col or str(col).startswith('unnamed_'):
            continue
            
        values = sample_df[col].dropna()
        if len(values) == 0:
            column_types[col] = "unknown"
            continue
        
        # Count type occurrences
        type_counts = {
            "numeric": 0,
            "date": 0,
            "boolean": 0,
            "text": 0
        }
        
        for val in values:
            # Check if numeric
            try:
                float(val)
                type_counts["numeric"] += 1
                continue
            except:
                pass
            
            # Check if date
            date_val = parse_date_value(val)
            if date_val:
                type_counts["date"] += 1
                continue
            
            # Check if boolean
            val_str = str(val).lower().strip()
            if val_str in ('yes', 'no', 'true', 'false', '1', '0', 't', 'f', 'y', 'n'):
                type_counts["boolean"] += 1
                continue
            
            # Default to text
            type_counts["text"] += 1
        
        # Determine predominant type
        total = sum(type_counts.values())
        if total == 0:
            column_types[col] = "unknown"
        else:
            # Set threshold at 70% for confident type assignment
            for type_name, count in type_counts.items():
                if count / total >= 0.7:
                    column_types[col] = type_name
                    break
            else:
                column_types[col] = "mixed"
    
    return column_types

def map_columns_to_fields(columns, field_mappings, observed_types=None):
    """
    Maps dataframe columns to expected fields based on name matching and data types.
    Returns a dictionary mapping column names to field names.
    """
    field_map = {}
    matched_fields = set()
    
    # First pass: Look for exact or high-confidence matches
    for col in columns:
        col_lower = str(col).lower()
        for field, variations in field_mappings.items():
            if field in matched_fields:
                continue
                
            # Check for exact matches first
            if col_lower in [v.lower() for v in variations]:
                field_map[col] = field
                matched_fields.add(field)
                break
                
            # Then try fuzzy matching with high threshold
            match, score = fuzzy_match(col_lower, variations, threshold=90)
            if match:
                field_map[col] = field
                matched_fields.add(field)
                break
    
    # Second pass: Try fuzzy matching with lower threshold for remaining columns
    for col in columns:
        if col in field_map:
            continue
            
        col_lower = str(col).lower()
        for field, variations in field_mappings.items():
            if field in matched_fields:
                continue
                
            match, score = fuzzy_match(col_lower, variations, threshold=80)
            if match:
                field_map[col] = field
                matched_fields.add(field)
                break
    
    # Optional third pass: Use observed data types to disambiguate
    if observed_types:
        for col in columns:
            if col in field_map or col not in observed_types:
                continue
                
            col_type = observed_types[col]
            
            # Map numeric columns to quantity/price/cost if they're not already matched
            if col_type == "numeric":
                for field in ["quantity", "price", "cost", "revenue"]:
                    if field not in matched_fields:
                        field_map[col] = field
                        matched_fields.add(field)
                        break
            
            # Map date columns to date fields
            elif col_type == "date":
                for field in ["time_period", "order_date", "arrival_date"]:
                    if field not in matched_fields:
                        field_map[col] = field
                        matched_fields.add(field)
                        break
    
    return field_map

def clean_extracted_data(df, field_map, schema):
    """
    Cleans and validates extracted data based on the schema.
    Returns a cleaned dataframe with valid data only.
    """
    # Create a new dataframe with mapped columns
    extracted_df = pd.DataFrame()
    
    # Process each mapped field
    for col, field in field_map.items():
        if field in schema:
            field_schema = schema[field]
            
            # Apply validation and conversion
            extracted_df[field] = df[col].apply(
                lambda x: validate_and_convert_value(x, field_schema)
            )
    
    # Remove rows where required fields are missing
    for field, field_schema in schema.items():
        if field_schema["required"] and field in extracted_df.columns:
            extracted_df = extracted_df.dropna(subset=[field])
    
    # Remove rows that have too many missing values
    min_non_null = max(2, len(extracted_df.columns) // 2)  # At least 2 or half the fields
    extracted_df = extracted_df.dropna(thresh=min_non_null)
    
    return extracted_df

def convert_to_records(df):
    """
    Converts a dataframe to a list of clean records (dictionaries),
    handling NaN values and type conversion properly.
    """
    # Convert to records
    records = df.to_dict(orient="records")
    
    # Clean each record
    clean_records = []
    for record in records:
        clean_record = {}
        for key, value in record.items():
            # Skip null values
            if pd.isna(value):
                continue
                
            # Convert types for JSON serialization
            if isinstance(value, (datetime, pd.Timestamp)):
                clean_record[key] = value.strftime("%Y-%m-%d")
            elif isinstance(value, (np.int64, np.float64)):
                clean_record[key] = float(value)
            else:
                clean_record[key] = value
                
        # Only add records with at least one field
        if clean_record:
            clean_records.append(clean_record)
    
    return clean_records

def is_pivot_table(df):
    """
    Detect if a dataframe likely contains a pivot table based on structure.
    """
    if len(df) < 3 or len(df.columns) < 3:
        return False
        
    # Check for blank cells in what would be the header region
    has_empty_corner = pd.isna(df.iloc[0, 0])
    
    # Check for multiple header rows with common patterns
    potential_row_headers = []
    for i in range(min(3, len(df))):
        row = df.iloc[i]
        non_null_count = row.count()
        null_pattern = [pd.isna(x) for x in row]
        
        # Pivots often have empty cells in header rows
        if non_null_count > 0 and non_null_count < len(row):
            potential_row_headers.append(i)
    
    # Look for hierarchical column structure
    hierarchical_cols = False
    if len(df.columns) > 3:
        # Get first few rows to check for potential column headers
        header_sample = df.iloc[:3, :3].values
        # Count unique values in each column of the sample
        col_unique_counts = [len(set([str(x) for x in col if not pd.isna(x)])) 
                            for col in header_sample.T]
        # If first column has fewer unique values, might be a row header
        if col_unique_counts and col_unique_counts[0] < np.mean(col_unique_counts[1:]):
            hierarchical_cols = True
    
    # Check for numeric data concentrated in the "body" of the table
    numeric_concentration = False
    if len(df) > 5 and len(df.columns) > 5:
        # Check central section of the dataframe
        central_section = df.iloc[3:, 1:]
        numeric_count = central_section.select_dtypes(include=[np.number]).count().sum()
        total_count = central_section.count().sum()
        if total_count > 0 and numeric_count / total_count > 0.7:
            numeric_concentration = True
    
    # Combined signals suggest a pivot table
    pivot_signals = sum([
        has_empty_corner,
        len(potential_row_headers) > 0,
        hierarchical_cols,
        numeric_concentration
    ])
    
    return pivot_signals >= 2  # At least 2 signals needed to classify as pivot

def extract_pivot_header_structure(df):
    """
    Extract hierarchical header structure from a pivot table.
    Returns row_headers, column_headers, and data_start_position.
    """
    # Initialize result
    row_header_cols = []
    col_header_rows = []
    data_start_row = 0
    data_start_col = 0
    
    # Find the first row with significant non-null values
    for i in range(min(10, len(df))):
        non_null_count = df.iloc[i].count()
        if non_null_count > len(df.columns) * 0.5:
            data_start_row = i
            break
    
    # Determine row header columns (typically on the left)
    # We look for columns where values are repeated or are string labels
    for j in range(min(5, len(df.columns))):
        col_values = df.iloc[data_start_row:, j].dropna()
        if len(col_values) > 0:
            # Check if column contains mostly strings
            string_ratio = col_values.apply(lambda x: isinstance(x, str)).mean()
            # Or has many repeated values
            unique_ratio = len(col_values.unique()) / len(col_values)
            
            if string_ratio > 0.7 or unique_ratio < 0.4:
                row_header_cols.append(j)
                data_start_col = max(data_start_col, j + 1)
            else:
                break
        else:
            break
    
    # If we didn't find any row header columns but should have
    if not row_header_cols and data_start_row > 0:
        row_header_cols = [0]  # Default to first column
        data_start_col = 1
    
    # Determine column header rows (typically at the top)
    col_header_rows = list(range(data_start_row))
    
    return {
        'row_header_cols': row_header_cols,
        'col_header_rows': col_header_rows,
        'data_start_row': data_start_row,
        'data_start_col': data_start_col
    }

def normalize_pivot_table(df, pivot_structure):
    """
    Transform a pivot table into a normalized flat table structure.
    """
    # Extract structure components
    row_header_cols = pivot_structure['row_header_cols']
    col_header_rows = pivot_structure['col_header_rows']
    data_start_row = pivot_structure['data_start_row']
    data_start_col = pivot_structure['data_start_col']
    
    # Extract row headers
    row_headers = df.iloc[data_start_row:, row_header_cols].copy()
    
    # Combine multi-level column headers if present
    if col_header_rows:
        # Extract header rows
        header_df = df.iloc[col_header_rows, data_start_col:].copy()
        
        # Combine headers into a single level
        combined_headers = []
        for j in range(len(header_df.columns)):
            header_parts = []
            for i in range(len(header_df)):
                val = header_df.iloc[i, j]
                if not pd.isna(val):
                    header_parts.append(str(val))
            combined_headers.append(" - ".join(header_parts))
        
        # Create new column names
        new_cols = {}
        for j, header in enumerate(combined_headers):
            new_cols[df.columns[j + data_start_col]] = header
        
        # Rename data columns
        df = df.rename(columns=new_cols)
    
    # Create normalized table
    result_rows = []
    
    # Iterate through each data row
    for i in range(data_start_row, len(df)):
        row_header_values = {}
        
        # Extract row header values
        for idx, col in enumerate(row_header_cols):
            header_name = f"row_header_{idx+1}"
            value = df.iloc[i, col]
            row_header_values[header_name] = value
        
        # Extract data cells for this row
        for j in range(data_start_col, len(df.columns)):
            if j < len(df.columns):
                col_header = df.columns[j]
                value = df.iloc[i, j]
                
                if not pd.isna(value):
                    # Create a normalized row
                    norm_row = row_header_values.copy()
                    norm_row["column_header"] = col_header
                    norm_row["value"] = value
                    result_rows.append(norm_row)
    
    # Convert to dataframe
    if result_rows:
        normalized_df = pd.DataFrame(result_rows)
        return normalized_df
    else:
        return pd.DataFrame()

def extract_data(file, business_type="generic"):
    """
    Enhanced extraction engine that:
    1. Uses business-type specific logic
    2. Improves header and schema detection
    3. Handles various date formats
    4. Provides better data validation and cleaning
    5. Handles pivot tables with intelligent structure detection
    """
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
    
    # Get field mappings for this business type
    field_mappings = get_field_mappings(business_type)
    
    # Process each sheet
    for sheet in xl.sheet_names:
        try:
            # Try to read the sheet - skip if it causes errors
            try:
                # First read just a sample to analyze
                df_sample = xl.parse(sheet, nrows=50)
                if df_sample.empty or len(df_sample.columns) < 2:
                    continue
                    
                # Ensure unique column names
                df_sample.columns = ensure_unique_columns(df_sample.columns)
                
            except Exception as e:
                print(f"Error reading sample from sheet '{sheet}': {str(e)}")
                continue
                
            # Detect most likely sheet category
            sheet_category = detect_sheet_category(sheet, business_type)
            if sheet_category == "unclassified":
                continue
                
            # Get schema for this category
            schema = EXTRACTION_SCHEMAS[sheet_category]
            required_fields = [f for f, s in schema.items() if s["required"]]
            
            # Check if this might be a pivot table
            is_pivot = is_pivot_table(df_sample)
            
            if is_pivot:
                # Read the full sheet for pivot processing
                df = xl.parse(sheet)
                
                # Extract pivot structure
                pivot_structure = extract_pivot_header_structure(df)
                
                # Transform pivot to normalized form
                normalized_df = normalize_pivot_table(df, pivot_structure)
                
                # Continue processing with the normalized dataframe
                if not normalized_df.empty:
                    df = normalized_df
                else:
                    # Failed to normalize, try regular processing
                    is_pivot = False
                    header_row = identify_header_row(df_sample, required_fields, field_mappings)
                    df = xl.parse(sheet, header=header_row)
            else:
                # Regular table processing - identify header row
                header_row = identify_header_row(df_sample, required_fields, field_mappings)
                
                # Now read the full sheet with the correct header row
                df = xl.parse(sheet, header=header_row)
            
            if df.empty:
                continue
                
            # Ensure unique column names again after full load
            df.columns = ensure_unique_columns(df.columns)
            
            # Detect data types for disambiguation
            column_types = detect_column_data_types(df)
            
            # Map columns to expected fields
            field_map = map_columns_to_fields(df.columns, field_mappings, column_types)
            
            # Skip sheets with insufficient mappings (less than 2 fields or no required fields)
            mapped_required = [f for c, f in field_map.items() if f in required_fields]
            if len(field_map) < 2 or not mapped_required:
                continue
                
            # Clean and validate data
            cleaned_df = clean_extracted_data(df, field_map, schema)
            
            # Convert to clean records and add to results
            records = convert_to_records(cleaned_df)
            
            # Add non-empty records to appropriate category
            if records:
                extracted_data[sheet_category].extend(records)
                
        except Exception as e:
            print(f"Error processing sheet '{sheet}': {str(e)}")
            continue

    # Ensure all values are JSON serializable
    for category in extracted_data:
        for i in range(len(extracted_data[category])):
            for field, value in extracted_data[category][i].items():
                if isinstance(value, (np.int64, np.float64)):
                    extracted_data[category][i][field] = float(value)
                elif isinstance(value, (datetime, pd.Timestamp)):
                    extracted_data[category][i][field] = value.strftime("%Y-%m-%d")

    return extracted_data