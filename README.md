Inventory Planning Checker
==========================

Comprehensive Project Documentation
-----------------------------------

This document provides a detailed guide to the Inventory Planning Checker system - a sophisticated tool for analyzing, classifying, and visualizing inventory planning data from Excel workbooks across different business types.

Table of Contents
-----------------

1.  [Project Overview](#project-overview)
    
2.  [System Architecture](#system-architecture)
    
3.  [Core Components](#core-components)
    
4.  [Classification Engine](#classification-engine)
    
5.  [Data Extraction System](#data-extraction-system)
    
6.  [Data Visualization Framework](#data-visualization-framework)
    
7.  [User Interface Components](#user-interface-components)
    
8.  [Data Flow and Processing](#data-flow-and-processing)
    
9.  [Business Type Adaptation](#business-type-adaptation)
    
10.  [Technical Implementation Details](#technical-implementation-details)
    
11.  [Setup and Installation](#setup-and-installation)
    
12.  [Development Guide](#development-guide)
    
13.  [Future Enhancements](#future-enhancements)
    

Project Overview
----------------

The Inventory Planning Checker is a specialized application designed to analyze Excel workbooks containing inventory management data. It performs three key functions:

1.  **Classification**: Determines whether an uploaded Excel file is an inventory planning workbook with a confidence score and detailed justification.
    
2.  **Data Extraction**: Identifies and extracts structured data for key inventory categories:
    
    *   Inventory on Hand (current stock levels)
        
    *   Sales History (past sales transactions)
        
    *   Purchase Orders (incoming inventory)
        
    *   Item Master (product catalog information)
        
3.  **Data Visualization**: Transforms extracted data into meaningful business insights through interactive charts and analytics.
    

What sets the system apart is its ability to adapt to different business types (retail, distribution, food/CPG) and extract meaningful data despite variations in file structure, terminology, and organization.

### Key Capabilities

*   **Smart Business Type Detection**: Analyzes content patterns to identify the business domain
    
*   **Fuzzy Matching**: Recognizes relevant data despite naming variations
    
*   **Confidence Scoring**: Provides transparency about classification certainty
    
*   **Data Quality Assessment**: Evaluates completeness and reliability of extracted data
    
*   **Interactive Visualizations**: Provides business-specific analytics dashboards
    
*   **Comprehensive Justification**: Explains classification reasoning in detail
    

System Architecture
-------------------

The application follows a client-server architecture with a clear separation of concerns:

### Backend (Python/Flask)

*   **Classification Engine**: Analyzes Excel files to determine if they contain inventory planning data
    
*   **Data Extraction System**: Locates and extracts structured data according to expected schemas
    
*   **API Layer**: Exposes functionality through RESTful endpoints
    

### Frontend (React)

*   **UI Components**: Provides intuitive user interfaces for file upload and results display
    
*   **Visualization Engine**: Renders interactive charts and data analytics
    
*   **State Management**: Handles application state and user interactions
    

### Data Flow

1.  User uploads Excel file through React frontend
    
2.  File is sent to Flask backend via API call
    
3.  Backend analyzes and classifies the file
    
4.  Data is extracted according to recognized patterns
    
5.  Results are returned to frontend
    
6.  Frontend renders classification results, visualizations, and data tables
    

Core Components
---------------

### 1\. app.py

The Flask application entry point that exposes the API endpoint for file upload and processing. Key responsibilities:

*   Initializes the Flask server
    
*   Handles file upload via /api/upload endpoint
    
*   Orchestrates the classification and extraction processes
    
*   Returns structured JSON response to the frontend
    

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   @app.route('/api/upload', methods=['POST'])  def upload_file():      # Read uploaded file      uploaded_file = request.files['file']      file_bytes = uploaded_file.read()      # Classify the file      classification_result = classify_file(BytesIO(file_bytes))      # Extract data if appropriate      business_type = classification_result.get("business_type", "generic")      extracted_data = extract_data(BytesIO(file_bytes), business_type=business_type)      # Return results      return jsonify({          "classification": classification_result,          "extracted_data": extracted_data      })   `

### 2\. file\_classifier.py

The classification engine responsible for analyzing Excel files and determining whether they contain inventory planning data. Features:

*   Business type detection
    
*   Pattern-based sheet classification
    
*   Fuzzy matching for varied terminology
    
*   Confidence scoring algorithm
    
*   Detailed justification generation
    

### 3\. extract\_data.py

The data extraction system that processes recognized inventory planning workbooks to extract structured data. Capabilities:

*   Schema-based data extraction
    
*   Multi-format date parsing
    
*   Data validation and cleaning
    
*   Business-specific field mapping
    
*   Data quality assessment
    

### 4\. InventoryPlannerUI.js

The main React component that handles user interactions and displays results. Responsibilities:

*   File upload interface
    
*   Classification result display
    
*   Data visualization coordination
    
*   Extracted data table presentation
    

### 5\. DataVisualizations.js

The visualization engine that transforms extracted data into meaningful charts and analytics. Features:

*   Interactive chart rendering
    
*   Business-specific KPI calculations
    
*   Tailored insights based on business type
    
*   Data quality visualization
    

Classification Engine
---------------------

The classification engine is one of the most sophisticated components of the system, using multiple signals to determine if a workbook contains inventory planning data.

### Classification Process

1.  **Sheet Name Analysis**: Examines sheet names for inventory-related terminology
    
2.  **Content Sampling**: Analyzes sample content from sheets to identify industry-specific terms
    
3.  **Column Detection**: Identifies columns that match expected inventory data fields
    
4.  **Pattern Recognition**: Looks for data patterns consistent with inventory management
    

### Business Type Detection

The system identifies the business domain using industry-specific markers:

*   **Retail**: Indicators like "jewelry", "watches", "eyewear", "apparel", "fashion"
    
*   **Distribution**: Indicators like "warehouse", "dc", "replen", "logistics", "fulfillment"
    
*   **Food/CPG**: Indicators like "production", "recipe", "ingredient", "lineage", "food"
    

### Confidence Scoring Algorithm

The confidence score is calculated using a weighted formula:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   def calculate_confidence(sheet_matches, column_matches):      # Sheet matches indicate strong signals (3x weight)      sheet_score = min(len(sheet_matches) * 0.25, 1.0) * 3      # Column matching evaluates field coverage (7x weight)      column_score = 0      if column_matches:          required_coverage = np.mean([              match["required_match_count"] / match["total_match_count"]               for match in column_matches if match["total_match_count"] > 0          ]) if column_matches else 0          sheet_proportion = min(len(column_matches) / max(len(sheet_matches), 1), 1.0)          column_score = (required_coverage * 0.7 + sheet_proportion * 0.3) * 7      # Combined score (normalized to 0-1)      total_score = (sheet_score + column_score) / 10      return min(max(total_score, 0.0), 1.0)   `

### Justification Generation

The system provides detailed explanations for its classification decision by:

1.  Listing matched sheets with confidence scores
    
2.  Identifying key fields found in each sheet
    
3.  Summarizing category-specific confidence levels
    
4.  Providing an overall assessment
    

Data Extraction System
----------------------

The data extraction system locates and extracts structured data from classified workbooks, adapting to different data organizations and naming conventions.

### Extraction Schemas

Each data category has a defined schema specifying required and optional fields:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   pythonCopyEXTRACTION_SCHEMAS = {      "inventory_on_hand": {          "sku": {"required": True, "type": "str", "validation": "alphanumeric"},          "quantity": {"required": True, "type": "float", "validation": "positive_numeric"},          "location": {"required": False, "type": "str", "validation": "text"}      },      "sales_history": {          "sku": {"required": True, "type": "str", "validation": "alphanumeric"},          "time_period": {"required": True, "type": "datetime", "validation": "date"},          "quantity": {"required": True, "type": "float", "validation": "numeric"},          "location": {"required": False, "type": "str", "validation": "text"},          "revenue": {"required": False, "type": "float", "validation": "numeric"},          "channel": {"required": False, "type": "str", "validation": "text"}      },      # Additional schemas for purchase_orders and item_master  }   `

### Field Mapping System

The system maps varied column names to standardized fields using business-type-specific mappings:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   FIELD_MAPPINGS = {      "generic": {          "sku": ["sku", "product code", "item id", "stock keeping unit", ...],          "quantity": ["quantity", "qty", "stock count", "inventory level", ...],          # Other generic mappings      },      "retail": {          "sku": ["sku", "variant_sku", "product sku", "style number", ...],          "quantity": ["available", "in stock", "on hand", ...],          # Retail-specific mappings      },      # Additional business type mappings  }   `

### Extraction Process

1.  **Category Detection**: Identifies which categories each sheet belongs to
    
2.  **Header Row Identification**: Locates the actual header row (not always the first row)
    
3.  **Column Mapping**: Maps columns to standardized fields
    
4.  **Data Type Detection**: Infers data types for disambiguation
    
5.  **Data Validation**: Validates and cleans extracted data
    
6.  **Record Creation**: Converts to structured records with proper data types
    

### Advanced Date Parsing

The system can parse various date formats through pattern recognition:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   DATE_FORMAT_PATTERNS = [      {"pattern": r"^\d{4}-\d{1,2}-\d{1,2}$", "format": "%Y-%m-%d"},  # YYYY-MM-DD      {"pattern": r"^\d{1,2}/\d{1,2}/\d{4}$", "format": "%m/%d/%Y"},  # MM/DD/YYYY      {"pattern": r"^Q[1-4]\s\d{4}$", "format": None, "handler": "fiscal_quarter"},  # Q1 2023      # Additional date patterns  ]   `

Data Visualization Framework
----------------------------

The visualization system transforms extracted data into meaningful business insights through interactive charts and analytics.

### Visualization Components

*   **KPI Cards**: Display key metrics with business context
    
*   **Charts**: Visualize data patterns and relationships
    
*   **Data Quality Heatmaps**: Assess data completeness and reliability
    
*   **Business-Specific Insights**: Provide domain-tailored analytics
    

### Category-Specific Visualizations

Each data category has specialized visualizations:

#### Inventory on Hand

*   Top Inventory Items by Quantity
    
*   Inventory Distribution by Location
    
*   Inventory Value Analysis
    

#### Sales History

*   Sales Trends Over Time
    
*   Top Selling Items
    
*   Channel Performance
    

#### Purchase Orders

*   Order Timeline Visualization
    
*   Vendor Analysis
    
*   Cost Distribution
    

#### Item Master

*   Product Category Breakdown
    
*   Price vs. Cost Analysis
    
*   Vendor Distribution
    

### Business Type Adaptations

Visualizations adapt based on the detected business type:

*   **Retail**: Focus on product performance, sell-through rates, and category analysis
    
*   **Distribution**: Emphasize warehouse utilization, fulfillment metrics, and logistics
    
*   **Food/CPG**: Highlight production planning, shelf-life, and batch analysis
    

### Chart Rendering System

Charts are rendered using Recharts library with a responsive design approach:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML

      `data={data}      margin={{ top: 5, right: 30, left: 20, bottom: 70 }}    >       value.toLocaleString()} />`          

User Interface Components
-------------------------

The user interface is built with modular React components that provide a cohesive experience.

### Core UI Components

#### Card System

The application uses a card-based layout system for organized content presentation:

*   Card: Container component for grouped content
    
*   CardHeader: Section for card titles and controls
    
*   CardTitle: Styled heading component
    
*   CardContent: Main content area with consistent padding
    

#### Button System

Customizable button components with consistent styling:

*   Standard buttons for primary actions
    
*   Variant styling for different button types (primary, outline, ghost)
    
*   Size variants for different contexts
    

#### Progress Component

Visual indicator for percentage-based metrics:

*   Used for confidence scores and data completeness
    
*   Supports multiple variants (default, success, warning, danger)
    
*   Animated transitions for value changes
    

#### Tabs System

Interactive tab navigation for multi-view interfaces:

*   Tabs: Container component managing active state
    
*   TabsList: Horizontal navigation container
    
*   TabsTrigger: Individual tab button
    
*   TabsContent: Content displayed for active tab
    

### Main Application Components

#### InventoryPlannerUI

The primary application component that orchestrates the user experience:

*   File upload interface
    
*   Results display coordination
    
*   State management
    
*   User interaction handling
    

#### Classification Result Display

Interactive section showing classification outcomes:

*   Business type identification
    
*   Confidence scoring with visual indicators
    
*   Expandable justification with detailed reasoning
    
*   Category-specific confidence metrics
    

#### Data Visualization Section

Interactive dashboards for data exploration:

*   Category-based tab navigation
    
*   KPI cards with key metrics
    
*   Interactive charts for pattern visualization
    
*   Business-specific insights
    

#### Extracted Data Tables

Interactive tables showing structured data:

*   Expandable metrics sections
    
*   Sortable columns
    
*   Data type-aware styling
    
*   Pagination for large datasets
    

Data Flow and Processing
------------------------

### End-to-End Data Flow

1.  **File Upload**
    
    *   User selects Excel file through the UI
        
    *   File is sent to backend via API call
        
2.  **Classification**
    
    *   Backend analyzes the file structure
        
    *   Business type is detected
        
    *   Classification decision is made with confidence score
        
    *   Detailed justification is generated
        
3.  **Data Extraction**
    
    *   If classified as inventory planning, data extraction begins
        
    *   Business-specific mappings are applied
        
    *   Data is extracted for each category
        
    *   Validation and cleaning is performed
        
4.  **Visualization**
    
    *   Frontend receives classification results and extracted data
        
    *   Business-specific visualizations are generated
        
    *   Data quality assessments are performed
        
    *   Interactive dashboards are rendered
        
5.  **User Interaction**
    
    *   User explores results through tabs and expandable sections
        
    *   Interactive elements allow deeper data exploration
        
    *   Data quality insights guide interpretation
        

### State Management

The application manages several key state variables:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   // File upload state  const [file, setFile] = useState(null);  const [loading, setLoading] = useState(false);  const [result, setResult] = useState(null);  const [error, setError] = useState(null);  // UI state  const [expandedJustification, setExpandedJustification] = useState(false);  const [expandedMetrics, setExpandedMetrics] = useState({});  const [activeTab, setActiveTab] = useState("inventory");   `

### Error Handling

The system implements comprehensive error handling:

*   Backend errors are captured and returned with explanatory messages
    
*   Frontend displays error messages for failed operations
    
*   Data validation issues are highlighted in the UI
    
*   Missing or incomplete data is handled gracefully
    

Business Type Adaptation
------------------------

One of the system's most powerful features is its ability to adapt to different business types.

### Business Type Detection

Business types are detected through pattern analysis:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   function detectBusinessType(data) {    // Scoring mechanism for business type signals    let retailScore = 0;    let distributionScore = 0;    let foodCpgScore = 0;    // Check sheet names for industry-specific terms    // Check sample content for domain vocabulary    // Analyze field patterns and data structures    // Return business type with highest score  }   `

### Business-Specific Field Mappings

Each business type has specialized field mappings that recognize industry terminology:

*   **Retail**: "collection", "style", "SKU", "variant", etc.
    
*   **Distribution**: "warehouse", "DC", "fulfillment center", "shipment", etc.
    
*   **Food/CPG**: "production", "batch", "recipe", "ingredient", etc.
    

### Visualization Adaptations

Visualizations are tailored to each business type:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   // Example of business type adaptation in visualization  function getBusinessInsights(data, businessType) {    if (businessType === 'retail') {      return [        { label: "Low Stock Items", value: calculateLowStockItems(data) },        { label: "Sell-Through Rate", value: calculateSellThrough(data) },        // Retail-specific insights      ];    } else if (businessType === 'distribution') {      return [        { label: "Warehouse Utilization", value: calculateWarehouseUtilization(data) },        { label: "Fulfillment Rate", value: calculateFulfillmentRate(data) },        // Distribution-specific insights      ];    } else if (businessType === 'food_cpg') {      return [        { label: "Production Efficiency", value: calculateProductionEfficiency(data) },        { label: "Batch Yield", value: calculateBatchYield(data) },        // Food/CPG-specific insights      ];    }  }   `

Technical Implementation Details
--------------------------------

### Classification Algorithm Details

The classification algorithm uses a combination of signals:

1.  **Sheet Name Matching**: Uses fuzzy matching to identify relevant sheets
    
2.  **Column Identification**: Maps columns to expected inventory fields
    
3.  **Data Pattern Analysis**: Checks for patterns consistent with inventory data
    
4.  **Business Type Markers**: Identifies industry-specific terminology
    

Each signal contributes to the confidence score with appropriate weighting.

### Fuzzy Matching Implementation

Fuzzy matching is a critical component for handling terminology variations:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   def fuzzy_match(target, candidates, threshold=85):      """      Enhanced fuzzy matching with multiple algorithms for better accuracy.      """      best_match = None      best_score = 0      for candidate in candidates:          # Try multiple scoring methods          ratio_score = fuzz.ratio(target, candidate.lower())          partial_score = fuzz.partial_ratio(target, candidate.lower())          token_sort_score = fuzz.token_sort_ratio(target, candidate.lower())          # Use best score from different methods          score = max(ratio_score, partial_score, token_sort_score)          if score > best_score and score >= threshold:              best_score = score              best_match = candidate      return best_match, best_score   `

### Data Validation System

Each field is validated according to its expected type and constraints:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   def validate_and_convert_value(value, field_schema):      """      Validates and converts a value based on the field schema.      """      field_type = field_schema["type"]      validation = field_schema["validation"]      # Type-specific validation and conversion      if field_type == "str":          value = str(value).strip()          if validation == "alphanumeric":              # Validate alphanumeric pattern              if not re.match(r'^[A-Za-z0-9\-_\.\/\s]+$', value):                  return None          return value      elif field_type == "float":          try:              float_val = float(value)              if validation == "positive_numeric" and float_val < 0:                  return None              return float_val          except:              return None      # Additional type validations...   `

### React Component Integration

The React components are integrated through a hierarchical structure:

*   App serves as the application container
    
*   InventoryPlannerUI manages the main user interface
    
*   DataVisualizations handles the visualization rendering
    
*   UI components (Card, Button, etc.) provide consistent styling
    

State is managed within appropriate component scopes, with parent components passing data to children through props.

Setup and Installation
----------------------

### Prerequisites

*   **Backend**: Python 3.7+ with Flask, pandas, openpyxl, FuzzyWuzzy
    
*   **Frontend**: Node.js with React, Tailwind CSS, Recharts
    

### Backend Setup

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   bashCopy# Clone the repository  git clone https://github.com/yourusername/inventory-planning-checker.git  cd inventory-planning-checker  # Set up Python environment  cd backend  python -m venv venv  source venv/bin/activate  # On Windows: venv\Scripts\activate  pip install -r requirements.txt  # Start the Flask server  python app.py   `

### Frontend Setup

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   bashCopy# Navigate to frontend directory  cd frontend  # Install dependencies  npm install  # Start development server  npm start   `

The application will be accessible at [http://localhost:3000](http://localhost:3000).

### Configuration Options

The application supports several configuration options:

*   **Classification Thresholds**: Adjust confidence thresholds in file\_classifier.py
    
*   **Field Mappings**: Extend field mappings in extract\_data.py
    
*   **Visualization Settings**: Customize chart options in DataVisualizations.js
    

Development Guide
-----------------

### Adding New Business Types

To add support for a new business type:

1.  Add business type detection patterns in file\_classifier.py
    
2.  Create business-specific field mappings in extract\_data.py
    
3.  Implement visualization adaptations in DataVisualizations.js
    

### Extending Field Mappings

To support additional field variations:

1.  Locate the appropriate field in FIELD\_MAPPINGS
    
2.  Add new variations to the corresponding array
    
3.  Consider adding business-specific variations if applicable
    

### Creating New Visualizations

To implement a new visualization:

1.  Add the necessary chart component in DataVisualizations.js
    
2.  Create data transformation functions for the visualization
    
3.  Integrate with the tab navigation system
    
4.  Add business-type-specific adaptations
    

### Testing and Validation

The system should be tested with diverse workbooks:

*   Different business types
    
*   Various file structures
    
*   Multiple naming conventions
    
*   Edge cases with incomplete data
    

Future Enhancements
-------------------

### Machine Learning Classification

Replace rule-based classification with a trained model:

*   Train on labeled inventory workbooks
    
*   Extract features from sheet and column patterns
    
*   Implement classification model
    
*   Integrate with existing system
    

### Advanced Data Relationship Detection

Enhance data extraction with relationship detection:

*   Identify related data across sheets
    
*   Detect hierarchical relationships
    
*   Connect master data with transactional data
    
*   Resolve data conflicts
    

### Expanded Business Intelligence

Add more sophisticated analytics capabilities:

*   Forecasting and trend analysis
    
*   Anomaly detection
    
*   Comparative benchmarking
    
*   Strategic recommendations
    

### Integration Capabilities

Enable integration with external systems:

*   API endpoints for programmatic access
    
*   Export capabilities to business systems
    
*   Scheduled analysis of workbooks
    
*   Integration with inventory management platforms