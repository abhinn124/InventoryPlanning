# Changelog

## Version 1.0 (Current)

### Initial Features:
- **React frontend** with file upload capability.
- **Python backend** with Flask API endpoint (`/api/upload`).
- **Basic classification logic** using Pandas and openpyxl:
  - Checks presence of sheets and columns.
  - Provides boolean prediction (`is_inventory_planning`).
  - Provides a confidence score (0 to 1 scale).
  - Provides clear justification of results.
- **Proper error handling** for invalid or incorrectly formatted files.
- **Warnings suppression** for openpyxl to handle incorrectly formatted Excel cells gracefully.
