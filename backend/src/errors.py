class InventoryPlannerError(Exception):
    """Base class for inventory planner exceptions"""
    def __init__(self, message, details=None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)

class FileReadError(InventoryPlannerError):
    """Raised when there's an issue reading the Excel file"""
    pass

class InvalidFileTypeError(InventoryPlannerError):
    """Raised when the file is not a valid Excel file"""
    pass

class FileSizeLimitError(InventoryPlannerError):
    """Raised when the file exceeds size limits"""
    pass

class EmptyFileError(InventoryPlannerError):
    """Raised when the file has no usable content"""
    pass

class DataExtractionError(InventoryPlannerError):
    """Raised when there's an issue extracting data"""
    pass

class SheetProcessingError(InventoryPlannerError):
    """Raised when there's an issue processing a specific sheet"""
    pass