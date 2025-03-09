# Inventory Planning Checker

A powerful tool for verifying and structuring Inventory Planning workbooks. This tool automates the **classification** and **data extraction** process, significantly reducing manual effort for sales engineering teams.  

---

## Table of Contents
1. [Description](#description)
2. [Enhancements and Fixes](#enhancements-and-fixes)
3. [How It Works](#how-it-works)
4. [Technologies Used](#technologies-used)
5. [Project Structure](#project-structure)
6. [Setup and Installation](#setup-and-installation)
7. [Running the Project](#running-the-project)
8. [Potential Future Improvements](#potential-future-improvements)

---

## Description

This tool automatically determines if an uploaded workbook is an **Inventory Planning file** and extracts structured data. It eliminates the need for manual validation by:
- **Detecting key sheets** (e.g., Inventory, Sales, Purchase Orders).
- **Identifying important columns** (`SKU`, `Quantity`, `Vendor`, etc.).
- **Providing structured data tables** for easy review.

---

## **Enhancements and Fixes**
This version includes **major improvements**:
- ✅ **More accurate classification** of Inventory Planning workbooks.
- ✅ **Improved fuzzy matching** to avoid false positives.
- ✅ **Better extraction logic** with:
  - **Strict column uniqueness enforcement** (fixing duplicate warnings).
  - **Header row detection and removal** (preventing misclassified data).
  - **Data type validation** (ensuring correct date and numeric parsing).
- ✅ **Fully redesigned UI**:
  - Interactive tables for extracted data.
  - Improved result visualization.

---

## 🔍 **How It Works**
### **Classification Process**
1. **File Upload**: User selects an Excel workbook and uploads it.
2. **Workbook Analysis**:
   - Identifies key **sheets** (e.g., `Inventory On Hand`, `Sales History`).
   - Checks for relevant **columns** (e.g., `SKU`, `Quantity`, `Vendor`).
   - Assigns a **confidence score** based on detected data.
3. **Results Display**:
   - Confidence % shown in UI.
   - Justification message explaining the classification decision.

### **Data Extraction**
The tool extracts structured data into:

| **Category**        | **Extracted Fields** |
|---------------------|----------------------|
| **Inventory on Hand** | SKU, Quantity, Location |
| **Sales History**   | SKU, Time period, Quantity, Revenue, Channel |
| **Purchase Orders** | PO ID, SKU, Quantity, Arrival Date, Vendor, Cost |
| **Item Master**     | SKU, Product Category, Vendor, Price |

These are displayed as **interactive tables** in the UI.

---

## 🛠️ **Technologies Used**
### **Frontend**:
- **React**
- TailwindCSS (for styling)
- Axios (for API requests)

### **Backend**:
- **Python + Flask**
- **Pandas + openpyxl** (for Excel processing)
- **FuzzyWuzzy** (for smart column matching)

---

## 📁 **Project Structure**
```
inventory-planning-checker/
├── backend/
│   ├── app.py
│   ├── src/
│   │   ├── extract_data.py  <-- Improved Extraction Logic
│   │   ├── file_classifier.py  <-- Improved Classification
│   ├── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── InventoryPlannerUI.js  <-- Improved UI with data tables
│   │   ├── services/api.js
│   ├── package.json
├── README.md
└── .gitignore
```

---

## 🚀 **Setup and Installation**
### 1️⃣ **Clone the Repository**
```bash
git clone https://github.com/your-username/inventory-planning-checker.git
cd inventory-planning-checker
```

### 2️⃣ **Backend Setup**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3️⃣ **Frontend Setup**
```bash
cd ../frontend
npm install
```

---

## ▶️ **Running the Project**
### **Start the Backend**
```bash
cd backend
source venv/bin/activate
python app.py
```
The backend runs at [http://localhost:5000](http://localhost:5000).

### **Start the Frontend**
```bash
cd ../frontend
npm start
```
The UI runs at [http://localhost:3000](http://localhost:3000).

---

## 🌟 **Potential Future Improvements**
- **Machine Learning** for smarter classification.
- **Error Reporting System** for UI/Backend failures.
- **Google Sheets Integration** to support cloud workbooks.