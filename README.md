Inventory Planning Checker
==========================

A Smart Analysis Tool for Inventory Management Workbooks
--------------------------------------------------------

Key Features
------------

### 1\. Smart Classification

The system can detect whether an Excel file contains inventory planning data with a confidence score and detailed justification. It analyzes sheet names, column patterns, and content to determine if the workbook is used for inventory planning.

### 2\. Business Type Detection

The application automatically recognizes the business domain (retail, distribution, food/CPG) by analyzing industry-specific terminology and patterns in the data. This allows for more accurate data extraction through specialized field mapping.

### 3\. Comprehensive Data Extraction

The system extracts structured data from four key inventory categories:

-   **Inventory on Hand**: Current stock levels and warehouse locations
-   **Sales History**: Historical sales transactions with time periods
-   **Purchase Orders**: Incoming inventory with arrival dates
-   **Item Master**: Product catalog with attributes and pricing

### 4\. Interactive Visualizations

Extracted data is transformed into business-specific visualizations to provide immediate insights:

-   Inventory level analysis with top items and location breakdowns
-   Sales trend analysis with channel performance metrics
-   Purchase order timelines and vendor analysis
-   Product category and margin analysis

### 5\. Pivot Table Handling

Many inventory workbooks use pivot tables for data organization. The system includes specialized algorithms to detect, normalize, and extract data from pivot tables while preserving their relational structure.

### 6\. Data Quality Assessment

The application evaluates the completeness and reliability of the extracted data, providing data quality scores and identifying potential gaps or issues in the source data.

System Architecture
-------------------

The Inventory Planning Checker follows a client-server architecture:

### Backend (Python/Flask)

-   **Classification Engine**: Analyzes workbooks to determine if they contain inventory planning data
-   **Extraction System**: Pulls structured data from identified sheets
-   **API Layer**: Exposes functionality through RESTful endpoints

### Frontend (React)

-   **File Upload Interface**: Simple interface for providing Excel files
-   **Visualization Engine**: Interactive data visualizations using Recharts
-   **Results Display**: Presents extraction results and data quality metrics

Technical Components
--------------------

### 1\. Classification Engine

The classification engine uses multiple signals to determine if a workbook contains inventory planning data:

```
classification_result = classify_file(BytesIO(file_bytes))

```

-   **Sheet Name Analysis**: Examines sheet names for inventory-related terminology
-   **Content Sampling**: Analyzes sample content to identify industry-specific terms
-   **Column Detection**: Identifies columns that match expected inventory fields
-   **Pattern Recognition**: Searches for data structures common in inventory management

The engine provides a confidence score and detailed justification for its classification decision.

### 2\. Extraction Engine

The extraction system handles the complexity of varied data formats:

```
extracted_data = extract_data(BytesIO(file_bytes), business_type=business_type)

```

-   **Schema-Based Extraction**: Uses predefined schemas for each data category
-   **Fuzzy Matching**: Identifies fields despite naming variations
-   **Data Validation**: Ensures extracted data meets quality standards
-   **Business-Specific Mapping**: Adapts to industry-specific terminology

### 3\. Visualization Components

The visualization engine translates data into interactive insights:

```
<DataVisualizations
  data={data}
  businessType={businessType}
  schemas={EXTRACTION_SCHEMAS}
/>

```

-   **Category-Specific Views**: Different visualizations for inventory, sales, orders, and products
-   **Business-Tailored Metrics**: Metrics adapted to each business type
-   **Interactive Charts**: Drill-down capabilities and multiple view options
-   **Data Quality Display**: Visual indicators of data completeness

Data Flow
---------

1.  **Upload**: User uploads an Excel workbook through the web interface
2.  **Classification**: Backend analyzes the file and determines if it contains inventory planning data
3.  **Extraction**: If classified as inventory planning, data is extracted according to business type
4.  **Visualization**: Frontend renders interactive visualizations and data tables
5.  **Interaction**: User explores data through various views and filters

Business Type Adaptations
-------------------------

### Retail/Fashion

-   Focuses on products, collections, and styles
-   Tracks inventory across locations
-   Analyzes sales by category and channel

### Distribution/Supply Chain

-   Emphasizes warehouse locations and stock levels
-   Focuses on fulfillment metrics and vendor performance
-   Tracks inventory movement across distribution centers

### Food/CPG

-   Adapts to batch production terminology
-   Handles time-sensitive inventory (expiration dates)
-   Recognizes manufacturing-specific fields

Installation & Usage
--------------------

### Backend Setup

```
# Clone the repository
git clone https://github.com/yourusername/inventory-planning-checker.git
cd inventory-planning-checker

# Set up Python environment
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start the Flask server
python app.py

```

### Frontend Setup

```
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm start

```

Access the application at http://localhost:3000

Robust Error Handling
---------------------

The system implements comprehensive error handling:

-   **File Validation**: Checks file format, size, and structure
-   **Extraction Robustness**: Handles missing fields and varied formats
-   **Visualization Fallbacks**: Graceful degradation when data is incomplete
-   **Helpful Error Messages**: Clear explanations when issues occur

Future Enhancements
-------------------

-   **Machine Learning Classification**: Train models on larger datasets for improved accuracy
-   **Advanced Relationship Detection**: Identify connections between data across sheets
-   **Predictive Analytics**: Add forecasting capabilities based on historical data
-   **Expanded Business Types**: Support for additional industry verticals
-   **Integration Capabilities**: API access for external systems
