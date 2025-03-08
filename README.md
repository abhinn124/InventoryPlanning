# Inventory Planning Checker

A demo application for verifying whether an uploaded spreadsheet is an “Inventory Planning” workbook. The goal of this tool is to reduce manual time spent by the sales engineering team on checking and classifying spreadsheets, ultimately speeding up client onboarding for an Inventory Planning system.

---

## Table of Contents
1. [Description](#description)
2. [Data Flow Diagram](#data-flow-diagram)
3. [Technologies Used](#technologies-used)
4. [Project Structure](#project-structure)
5. [Setting Up the Project](#setting-up-the-project)
6. [Running the Project](#running-the-project)
7. [How It Works (Under the Hood)](#how-it-works-under-the-hood)
8. [Potential Future Improvements](#potential-future-improvements)

---

## Description

Many companies have Excel-based or Google Sheets-based “Inventory Planning” workbooks containing:
- Inventory on Hand
- Sales History
- Purchase Orders
- Item Master data

Currently, a sales engineer must spend days verifying whether a client’s workbook is the correct format. This project automates the first step—_validating whether a file is likely an “Inventory Planning” workbook_—using Python for backend data parsing/classification, and a React frontend for file uploads and result display.

**Key Features**:
- Simple **React** UI for file upload
- **Python** backend (Flask) for:
  - Reading Excel/CSV files
  - Checking for relevant sheets and columns
  - Scoring how likely the workbook is an “Inventory Planning” file
  - Generating a justification message
- Real-time display of classification results (confidence score + reasoning)

---

## Data Flow Diagram

```
┌───────────────┐                      (1) File Upload                      ┌───────────────────────┐
│               │ ------------------>  │                       │
│  User (UI)    │                      │ React Frontend (App) │
│ (Web Browser) │ <------------------  │                       │
└───────────────┘                      (4) JSON Result                      └───────────┬───────────┘
                                                │ (2) POST
                                                ▼
                                   ┌─────────────────────────┐
                                   │ Flask / Python API      │
                                   │ (Classification Logic)  │
                                   └─────────────────────────┘
                                                ▲
                                                │ (3) Returns JSON
```

1. The user uploads a file via React UI.
2. The React app sends a **POST** request containing the file to the backend.
3. The backend classifies the file and returns a JSON response.
4. The frontend displays results (confidence & justification).

---

## Technologies Used

- **Frontend**:
  - React
  - Axios or Fetch API
- **Backend**:
  - Python 3
  - Flask
  - Pandas
  - openpyxl
- **Other**:
  - Git
  - Node.js + npm

---

## Project Structure

```
inventory-planning-checker/
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── src/
│       ├── __init__.py
│       └── file_classifier.py
├── frontend/
│   ├── package.json
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.js
│       ├── index.js
│       ├── components/
│       │   └── FileUpload.js
│       └── services/
│           └── api.js
├── .gitignore
├── README.md
└── LICENSE
```

---

## Setting Up the Project

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/inventory-planning-checker.git
cd inventory-planning-checker
```

### 2. Backend Setup

Create and activate a virtual environment:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

Install Python dependencies:

```bash
pip install -r requirements.txt
```

### 3. Frontend Setup

Install Node dependencies:

```bash
cd ../frontend
npm install
```

*(Optional)* Add proxy in `package.json`:
```json
"proxy": "http://localhost:5000"
```

---

## Running the Project

### Backend
```bash
cd backend
source venv/bin/activate
python app.py
```

Backend runs at `http://localhost:5000`.

### Frontend

```bash
cd ../frontend
npm start
```

Frontend runs at `http://localhost:3000`. Open this in your browser.

---

## How It Works (Under the Hood)

- User selects a file (Excel/CSV) using React UI (`FileUpload.js`).
- React sends POST request (`/api/upload`) to Flask backend.
- Python backend (`file_classifier.py`) reads workbook (via Pandas/openpyxl):
  - Checks for common sheets (e.g., Inventory, Purchase Orders).
  - Searches for columns like "SKU", "Quantity", "Purchase Order ID".
- Computes a confidence score based on detected signals.
- Backend responds with JSON:

```json
{
  "is_inventory_planning": true,
  "confidence": 0.8,
  "justification": "Sheet 'InventoryOnHand' has column SKU. Sheet 'PurchaseOrders' references Purchase Order."
}
```

Results appear immediately in UI.

---

## Potential Future Improvements

- **Advanced Classification**: Use NLP or ML for flexible column/sheet matching.
- **Multiple File Types**: CSV, Google Sheets integration.
- **Improved Error Handling**: Clearer error messages.
- **Role-Based Access**: Authentication for tracking uploads.
- **Deployment**: Dockerize the app, Gunicorn/Nginx setup.

---

Enjoy your streamlined Inventory Planning verification process! Adapt the logic as needed to make the tool even more robust.