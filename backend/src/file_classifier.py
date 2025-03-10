import pandas as pd
import numpy as np
import warnings
from fuzzywuzzy import fuzz
from collections import Counter

warnings.filterwarnings("ignore", category=UserWarning, module="openpyxl")

# Enhanced Sheet Mappings with Business-Type Specificity
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
    
    # Retail/fashion specific mappings (Company 3 pattern)
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
    
    # Food/CPG specific mappings (Company 1 pattern)
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
    
    # Distribution/Supply Chain specific mappings (Company 2 pattern)
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

# Enhanced Column Mappings with Validation Types
COLUMN_MAPPINGS = {
    # Inventory on Hand Fields
    "sku": {
        "variations": ["sku", "product code", "item id", "stock keeping unit", "item code", "product", 
                      "product id", "item number", "part number", "material number", "sku code", 
                      "product number", "variant id", "item", "upc", "product sku"],
        "required": True,
        "validation": "alphanumeric",
        "priority": 1
    },
    "quantity": {
        "variations": ["quantity", "qty", "stock count", "inventory level", "on hand", 
                      "available", "stock", "inventory", "in stock", "units", "on-hand",
                      "qty on hand", "physical qty", "inventory on hand", "available quantity",
                      "total qty", "cases", "pallets", "units", "inventory value", "count"],
        "required": True,
        "validation": "numeric",
        "priority": 1
    },
    "location": {
        "variations": ["location", "warehouse", "store", "dc", "site", "facility", "storage location",
                      "bin", "branch", "distribution center", "storage", "inventory location",
                      "warehouse location", "destination", "origin", "location name", "facility"],
        "required": False,
        "validation": "text",
        "priority": 2
    },
    
    # Sales History Fields
    "time_period": {
        "variations": ["date", "time period", "month", "week", "year", "period", "sales date", 
                      "order date", "transaction date", "ship date", "sales period", 
                      "order period", "fiscal period", "date range", "day", "quarter"],
        "required": True,
        "validation": "date",
        "priority": 1
    },
    "revenue": {
        "variations": ["revenue", "sales value", "total sales", "sales amount", "gross sales", 
                      "sales revenue", "net sales", "sales total", "amount", "order value", 
                      "transaction value", "gross revenue", "total value", "total revenue"],
        "required": False,
        "validation": "numeric",
        "priority": 2
    },
    "channel": {
        "variations": ["channel", "sales channel", "platform", "marketplace", "store type", 
                      "sales source", "outlet", "point of sale", "pos", "sales medium", 
                      "sales location", "customer type", "order type", "order source"],
        "required": False,
        "validation": "text",
        "priority": 3
    },
    
    # Purchase Orders Fields
    "purchase_order_id": {
        "variations": ["purchase order id", "po id", "order number", "po number", "po #", 
                      "purchase order", "order id", "po reference", "po no", "po num", 
                      "po", "order #", "reference number", "order reference", "po name"],
        "required": True,
        "validation": "alphanumeric",
        "priority": 1
    },
    "arrival_date": {
        "variations": ["arrival date", "expected delivery", "eta", "delivery date", 
                      "due date", "expected arrival", "receipt date", "promised date", 
                      "expected receipt", "arrival date", "delivery", "ship by", "ship date",
                      "planned arrival date", "pickup date"],
        "required": True,
        "validation": "date",
        "priority": 1
    },
    "cost": {
        "variations": ["cost", "unit cost", "purchase price", "item cost", "po cost", 
                      "invoice cost", "order cost", "product cost", "buying cost", 
                      "acquisition cost", "landed cost", "cost price", "purchase cost",
                      "invoice $ per case", "price per unit", "cogs"],
        "required": False,
        "validation": "numeric",
        "priority": 2
    },
    "order_date": {
        "variations": ["order date", "order placed", "date ordered", "po date", "issue date", 
                      "creation date", "placed date", "purchase date", "ordering date", 
                      "submitted date", "created date", "po created", "order created"],
        "required": False,
        "validation": "date",
        "priority": 2
    },
    "vendor": {
        "variations": ["vendor", "supplier", "manufacturer", "seller", "vendor name", 
                      "supplier name", "manufacturer name", "company", "vendor id", 
                      "supplier id", "provider", "source", "partner", "procurement source",
                      "transport", "carrier"],
        "required": False,
        "validation": "text",
        "priority": 2
    },
    "has_arrived": {
        "variations": ["has arrived", "arrived", "received", "status", "receipt status", 
                      "delivery status", "arrival status", "receipt confirmed", "in stock", 
                      "arrived status", "received status", "status code", "reception status"],
        "required": False,
        "validation": "boolean",
        "priority": 3
    },
    
    # Item Master Fields
    "price": {
        "variations": ["price", "unit price", "selling price", "retail price", "msrp", 
                      "list price", "sales price", "item price", "product price", 
                      "standard price", "base price", "rrp", "market price", "purchase price"],
        "required": False,
        "validation": "numeric",
        "priority": 2
    },
    "category": {
        "variations": ["category", "product category", "item type", "product type", 
                      "department", "class", "group", "product group", "merchandise group", 
                      "item category", "product class", "merchandise category", "category name",
                      "collection", "hierarchy", "product family"],
        "required": False,
        "validation": "text",
        "priority": 2
    }
}

def fuzzy_match(target, candidates, threshold=80):
    """ 
    Enhanced fuzzy matching with improved matching algorithm and threshold handling.
    Returns the match and the match score.
    """
    if not target or not isinstance(target, str):
        return None, 0
    
    target = str(target).strip().lower()
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

def detect_business_type(file):
    """
    Analyze sheet names and sample content to determine the most likely business type.
    Returns a dictionary with confidence scores for each business type.
    """
    try:
        xl = pd.ExcelFile(file)
        sheets = xl.sheet_names
        
        # Initialize scores for each business type
        scores = {
            "retail": 0,
            "food_cpg": 0, 
            "distribution": 0
        }
        
        # Score based on sheet names
        for sheet in sheets:
            sheet_lower = sheet.lower()
            
            # Retail indicators
            if any(kw in sheet_lower for kw in ["jewelry", "watches", "eyewear", "fashion", "apparel", 
                                              "product category", "style", "collection"]):
                scores["retail"] += 2
                
            # Food/CPG indicators
            if any(kw in sheet_lower for kw in ["production", "recipe", "ingredient", "true up", 
                                             "lineage", "food", "beverage", "manufacturing"]):
                scores["food_cpg"] += 2
                
            # Distribution indicators
            if any(kw in sheet_lower for kw in ["dc ", "distribution center", "replen", "supply chain", 
                                             "warehouse", "logistics", "fulfillment"]):
                scores["distribution"] += 2
        
        # Sample content from sheets to look for industry-specific terms
        product_terms = set()
        for sheet in sheets[:min(5, len(sheets))]:  # Check first 5 sheets
            try:
                df = xl.parse(sheet, nrows=50)  # Read sample rows
                for col in df.columns:
                    sample_values = df[col].astype(str).str.lower().tolist()[:20]  # Sample values
                    product_terms.update(sample_values)
            except:
                continue
        
        # Convert product_terms to a string for easier searching
        product_text = " ".join(str(term) for term in product_terms if term and not pd.isna(term))
        
        # Check for retail product keywords
        retail_keywords = ["jewelry", "watches", "eyewear", "apparel", "fashion", "accessories", 
                         "clothing", "shoes", "garment", "style"]
        for kw in retail_keywords:
            if kw in product_text:
                scores["retail"] += 1
        
        # Check for food/CPG keywords
        food_keywords = ["food", "beverage", "ingredient", "recipe", "pack", "pouch", "box", 
                        "cases", "pallets", "production"]
        for kw in food_keywords:
            if kw in product_text:
                scores["food_cpg"] += 1
        
        # Check for distribution keywords
        dist_keywords = ["warehouse", "pallet", "shipping", "freight", "carrier", "logistics", 
                        "distribution", "fulfillment", "supply chain"]
        for kw in dist_keywords:
            if kw in product_text:
                scores["distribution"] += 1
        
        # Determine most likely business type
        max_score = max(scores.values())
        if max_score == 0:
            return "generic"  # Default if no strong signals
        
        return max(scores.items(), key=lambda x: x[1])[0]
        
    except Exception as e:
        print(f"Error in business type detection: {str(e)}")
        return "generic"  # Fallback to generic in case of errors

def analyze_column_matches(xl, sheet_category):
    """
    Analyze how well the columns in each sheet match expected fields for this category.
    Returns a dictionary with matched fields and their confidence.
    """
    try:
        sheets = xl.sheet_names
        column_matches = []
        
        # Determine which fields to look for based on sheet category
        if sheet_category == "inventory_on_hand":
            required_fields = ["sku", "quantity"]
            optional_fields = ["location"]
        elif sheet_category == "sales_history":
            required_fields = ["sku", "time_period", "quantity"]
            optional_fields = ["revenue", "channel"]
        elif sheet_category == "purchase_orders":
            required_fields = ["purchase_order_id", "sku", "quantity", "arrival_date"]
            optional_fields = ["cost", "order_date", "vendor", "has_arrived"]
        elif sheet_category == "item_master":
            required_fields = ["sku"]
            optional_fields = ["category", "vendor", "price", "cost"]
        else:
            return []
        
        all_target_fields = required_fields + optional_fields
        
        for sheet in sheets:
            try:
                df = xl.parse(sheet, nrows=10)  # Read sample rows
                if df.empty or len(df.columns) < 2:  # Skip empty or single-column sheets
                    continue
                    
                columns_lower = [str(c).lower().strip() for c in df.columns]
                
                # Check for matches to this category
                sheet_matches = []
                for field in all_target_fields:
                    field_variations = COLUMN_MAPPINGS[field]["variations"]
                    best_match = None
                    best_score = 0
                    matched_column = None
                    
                    for i, col in enumerate(columns_lower):
                        match, score = fuzzy_match(col, field_variations)
                        if match and score > best_score:
                            best_score = score
                            best_match = match
                            matched_column = df.columns[i]
                    
                    if best_match:
                        sheet_matches.append({
                            "field": field,
                            "matched_column": matched_column,
                            "score": best_score,
                            "required": field in required_fields
                        })
                
                if sheet_matches:
                    # Check if we have matches for required fields
                    required_matched = [m for m in sheet_matches if m["required"]]
                    if len(required_matched) >= len(required_fields) * 0.6:  # At least 60% of required fields
                        column_matches.append({
                            "sheet": sheet,
                            "matches": sheet_matches,
                            "required_match_count": len(required_matched),
                            "total_match_count": len(sheet_matches)
                        })
            except Exception as e:
                print(f"Error analyzing columns in sheet '{sheet}': {str(e)}")
                continue
                
        return column_matches
        
    except Exception as e:
        print(f"Error in column analysis: {str(e)}")
        return []

def calculate_confidence(sheet_matches, column_matches):
    """
    Calculate confidence score based on various factors:
    - Sheet name matches
    - Key column presence
    - Required field coverage
    
    Returns a confidence score between 0 and 1
    """
    # Base score from sheet names (3x weight)
    sheet_score = min(len(sheet_matches) * 0.25, 1.0) * 3
    
    # Column matching score - more sophisticated based on field requirements
    column_score = 0
    if column_matches:
        # Calculate average coverage of required fields across matched sheets
        required_coverage = np.mean([
            match["required_match_count"] / match["total_match_count"] 
            for match in column_matches if match["total_match_count"] > 0
        ]) if column_matches else 0
        
        # Calculate proportion of sheets with good column matches
        sheet_proportion = min(len(column_matches) / max(len(sheet_matches), 1), 1.0)
        
        column_score = (required_coverage * 0.7 + sheet_proportion * 0.3) * 7  # 7x weight
    
    # Combined score (normalized to 0-1)
    total_score = (sheet_score + column_score) / 10
    
    # Ensure score is between 0 and 1
    return min(max(total_score, 0.0), 1.0)

def classify_file(file):
    """
    Enhanced classifier that:
    1. Detects business type
    2. Uses business-specific mappings
    3. Performs in-depth sheet and column analysis
    4. Calculates nuanced confidence score
    5. Provides detailed justification
    """
    try:
        xl = pd.ExcelFile(file)
        sheets = xl.sheet_names
    except Exception as e:
        return {
            'is_inventory_planning': False,
            'confidence': 0.0,
            'justification': f'File read error: {str(e)}',
            'business_type': 'unknown'
        }
    
    # Detect business type
    business_type = detect_business_type(file)
    
    # Initialize results
    category_matches = {}
    justification_parts = []
    matched_sheets = []
    
    # Get relevant mappings (combine generic with business-specific)
    sheet_mappings = {}
    for category in SHEET_MAPPINGS["generic"]:
        sheet_mappings[category] = SHEET_MAPPINGS["generic"][category].copy()
        if business_type in SHEET_MAPPINGS and category in SHEET_MAPPINGS[business_type]:
            sheet_mappings[category].extend(SHEET_MAPPINGS[business_type][category])
    
    # Sheet recognition - Match sheets to categories
    for sheet in sheets:
        sheet_lower = sheet.lower()
        
        for category, variations in sheet_mappings.items():
            match, score = fuzzy_match(sheet_lower, variations)
            if match:
                if category not in category_matches:
                    category_matches[category] = []
                    
                category_matches[category].append({
                    'sheet': sheet,
                    'match': match,
                    'score': score
                })
                matched_sheets.append(sheet)
                justification_parts.append(f'Sheet "{sheet}" identified as {category} data (match: {match}, confidence: {score}%)')
    
    # Column recognition - Check for expected fields
    all_column_matches = {}
    for category, matches in category_matches.items():
        column_matches = analyze_column_matches(xl, category)
        if column_matches:
            all_column_matches[category] = column_matches
            
            # Add justification for column matches
            for match in column_matches:
                sheet = match["sheet"]
                required_fields = [m["field"] for m in match["matches"] if m["required"]]
                justification_parts.append(
                    f'Sheet "{sheet}" contains key {category} fields: {", ".join(required_fields)}'
                )
    
    # Calculate confidence scores for each category
    category_confidence = {}
    for category, sheet_matches in category_matches.items():
        column_matches = all_column_matches.get(category, [])
        confidence = calculate_confidence(sheet_matches, column_matches)
        category_confidence[category] = confidence
    
    # Overall confidence is the maximum confidence across categories
    overall_confidence = max(category_confidence.values()) if category_confidence else 0.0
    
    # Final classification decision
    is_inventory_planning = overall_confidence >= 0.5
    
    # Generate comprehensive justification
    if is_inventory_planning:
        # Add business type detection to justification
        justification_parts.insert(0, f'Detected business type: {business_type}')
        
        # Add strongest category signals
        for category, confidence in category_confidence.items():
            justification_parts.append(
                f'{category.replace("_", " ").title()} data identified with {confidence:.1%} confidence'
            )
            
        # Add overall assessment
        justification_parts.append(
            f'Overall confidence: {overall_confidence:.1%} - This is an inventory planning workbook'
        )
    else:
        # Explain why it's not an inventory planning workbook
        justification_parts.append(
            f'Insufficient inventory planning signals detected (confidence: {overall_confidence:.1%})'
        )
        
        if not category_matches:
            justification_parts.append('No recognized inventory sheets found')
        elif not all_column_matches:
            justification_parts.append('Missing expected column patterns for inventory data')
    
    # Combine all justification parts
    justification = '. '.join(justification_parts)
    
    return {
    'is_inventory_planning': bool(is_inventory_planning),
    'confidence': float(overall_confidence), 
    'justification': justification,
    'business_type': str(business_type), 
    'category_confidence': {k: float(v) for k, v in category_confidence.items()} 
}