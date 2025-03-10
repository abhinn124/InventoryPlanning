import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Progress } from "./ui/Progress";
import { Button } from "./ui/Button";
import { UploadCloud, CheckCircle, XCircle, ArrowDownUp, ChevronDown, ChevronUp, BarChart2, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { uploadFile } from "../services/api";
import DataVisualizations from "./DataVisualizations"; 
import { EXTRACTION_SCHEMAS } from "../utils/schemas"; 

const InventoryPlannerUI = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [expandedJustification, setExpandedJustification] = useState(false);
  const [sortConfig, setSortConfig] = useState({});
  const [expandedMetrics, setExpandedMetrics] = useState({});

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setErrorDetails(null);
    
    try {
      const data = await uploadFile(file);
      
      // Check for error info in the response
      if (data.error) {
        setError(data.error);
        setErrorDetails({
          type: data.error_type || 'unknown',
          suggestions: data.suggestions || [],
          details: data.details || {}
        });
        
        // For partial success cases, still show available data
        if (data.classification) {
          setResult(data);
        } else {
          setResult(null);
        }
      } else {
        setResult(data);
      }
    } catch (error) {
      console.error("Error during file upload:", error);
      // Try to parse the error response
      let errorMessage = "Failed to process file. Please try again.";
      let errorType = "unknown";
      let suggestions = [];
      
      if (error.response && error.response.data) {
        const responseData = error.response.data;
        errorMessage = responseData.error || errorMessage;
        errorType = responseData.error_type || errorType;
        suggestions = responseData.suggestions || suggestions;
      }
      
      setError(errorMessage);
      setErrorDetails({
        type: errorType,
        suggestions: suggestions,
        details: {}
      });
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const valueDisplay = (value) =>
    value !== null && value !== undefined ? value.toString() : "";

  // Function to get key evidence points from justification
  const getKeyEvidence = (justification) => {
    const points = justification.split(". ").filter(Boolean);
    
    // Look for specific high-value signals
    const businessType = points.find(p => p.startsWith("Detected business type"));
    const highConfidenceSheets = points
      .filter(p => p.includes("identified as") && p.includes("confidence: 100%"))
      .slice(0, 2);
    const confidencePoints = points.filter(p => 
      p.includes("data identified with") && p.includes("confidence")
    );
    
    // Combine and return top 3-5 points
    return [businessType, ...highConfidenceSheets, ...confidencePoints]
      .filter(Boolean)
      .slice(0, 5);
  };

  // Function to generate summary stats for a dataset
  const generateBasicMetrics = (data) => {
    if (!data || data.length === 0) return null;
    
    const metrics = {
      recordCount: data.length,
      fieldCompleteness: {}
    };
    
    // Calculate field completeness
    const fields = Object.keys(data[0] || {});
    fields.forEach(field => {
      const filledCount = data.filter(record =>
        record[field] !== null && record[field] !== undefined && record[field] !== ""
      ).length;
      metrics.fieldCompleteness[field] = (filledCount / data.length) * 100;
    });
    
    // For numeric fields, calculate min, max, avg
    fields.forEach(field => {
      const numericValues = data
        .map(record => record[field])
        .filter(val => !isNaN(parseFloat(val)) && isFinite(val))
        .map(val => parseFloat(val));
      
      if (numericValues.length > 0) {
        metrics[field] = {
          min: Math.min(...numericValues),
          max: Math.max(...numericValues),
          avg: numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length
        };
      }
    });
    
    return metrics;
  };

  // Sort data in a table
  const sortData = (category, field) => {
    setSortConfig(prevConfig => {
      const direction =
        prevConfig.category === category &&
        prevConfig.field === field &&
        prevConfig.direction === "asc"
          ? "desc"
          : "asc";
      return { category, field, direction };
    });
  };

  // Get sorted data for a category
  const getSortedData = (category, data) => {
    if (!sortConfig.category || sortConfig.category !== category || !sortConfig.field) {
      return data;
    }
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.field];
      const bValue = b[sortConfig.field];
      
      // Handle null/undefined values
      if (aValue === null || aValue === undefined)
        return sortConfig.direction === "asc" ? -1 : 1;
      if (bValue === null || bValue === undefined)
        return sortConfig.direction === "asc" ? 1 : -1;
      
      // Compare based on type
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
      }
      
      // Default string comparison
      return sortConfig.direction === "asc"
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
  };

  // Toggle metrics display for a category
  const toggleMetrics = (category) => {
    setExpandedMetrics(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Error Display Component
  const ErrorDisplay = ({ error, details }) => {
    if (!error) return null;
    
    // Different styling based on error type
    const getErrorIcon = (type) => {
      switch(type) {
        case 'file_too_large':
        case 'invalid_file_type':
        case 'missing_file':
          return <AlertTriangle className="h-5 w-5 text-amber-500" />;
        case 'extraction_error':
        case 'file_read_error':
          return <Info className="h-5 w-5 text-blue-500" />;
        default:
          return <AlertCircle className="h-5 w-5 text-red-500" />;
      }
    };
    
    const getErrorColor = (type) => {
      switch(type) {
        case 'file_too_large':
        case 'invalid_file_type':
        case 'missing_file':
          return 'bg-amber-50 border-amber-200 text-amber-800';
        case 'extraction_error':
        case 'file_read_error':
          return 'bg-blue-50 border-blue-200 text-blue-800';
        default:
          return 'bg-red-50 border-red-200 text-red-800';
      }
    };
    
    return (
      <div className={`mt-4 p-4 rounded-lg border ${getErrorColor(details?.type)}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0 mt-0.5">
            {getErrorIcon(details?.type)}
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium">{error}</h3>
            
            {details?.suggestions && details.suggestions.length > 0 && (
              <div className="mt-2">
                <h4 className="text-sm font-medium">Suggestions:</h4>
                <ul className="mt-1 list-disc list-inside text-sm">
                  {details.suggestions.map((suggestion, idx) => (
                    <li key={idx}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {details?.details && Object.keys(details.details).length > 0 && (
              <div className="mt-2">
                <h4 className="text-sm font-medium">Details:</h4>
                <ul className="mt-1 text-sm">
                  {Object.entries(details.details).map(([key, value], idx) => (
                    <li key={idx}>
                      <span className="font-medium">{key}:</span> {value}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-8 bg-gray-50 min-h-screen text-gray-900">
      <h1 className="text-4xl font-bold">Inventory Planner</h1>

      <Card className="w-full max-w-2xl p-6 shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Upload Your Workbook</CardTitle>
        </CardHeader>
        <CardContent>
          <input
            type="file"
            accept=".xlsx, .csv"
            onChange={handleFileChange}
            className="border p-3 rounded-lg w-full mb-4"
          />
          <Button
            className="mt-4 w-full text-lg flex items-center justify-center gap-2"
            onClick={handleUpload}
            disabled={loading || !file}
          >
            <UploadCloud className="h-5 w-5" /> Upload
          </Button>
        </CardContent>
      </Card>

      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center text-lg font-semibold"
          >
            Processing file...
          </motion.div>
        )}
      </AnimatePresence>

      {error && <ErrorDisplay error={error} details={errorDetails} />}

      {result && result.classification && (
        <>
          {/* Classification Result Card */}
          <Card className="w-full max-w-3xl p-6 shadow-lg rounded-xl text-left">
            <CardHeader>
              <CardTitle className="text-2xl">Classification Result</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Business Type Section */}
              <div className="mb-4">
                <span className="font-semibold text-lg">Business Type:</span>
                <div className="mt-2 px-4 py-2 bg-blue-50 rounded-lg">
                  <span className="capitalize text-blue-800 font-medium">
                    {result.classification.business_type || "Unknown"}
                  </span>
                </div>
              </div>

              {/* Inventory Planning Status */}
              <div className="flex items-center gap-4 text-lg">
                {result.classification.is_inventory_planning ? (
                  <CheckCircle className="text-green-500" />
                ) : (
                  <XCircle className="text-red-500" />
                )}
                <span className="font-semibold">Inventory Planning File:</span>
                <span>{result.classification.is_inventory_planning ? "Yes" : "No"}</span>
              </div>

              {/* Overall Confidence */}
              <div>
                <span className="font-semibold">Overall Confidence:</span>
                <div className="flex items-center mt-2">
                  <Progress
                    value={result.classification.confidence * 100}
                    className="flex-grow mr-2"
                    variant={
                      result.classification.confidence > 0.8
                        ? "success"
                        : result.classification.confidence > 0.5
                        ? "warning"
                        : "danger"
                    }
                  />
                  <span className="text-lg font-semibold">
                    {(result.classification.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Category Confidence (if available) */}
              {result.classification.category_confidence && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Category Confidence:</h3>
                  <div className="space-y-2">
                    {Object.entries(result.classification.category_confidence).map(
                      ([category, confidence]) => (
                        <div key={category} className="flex items-center gap-2">
                          <span className="capitalize text-gray-700 min-w-40">
                            {category.replace("_", " ")}:
                          </span>
                          <Progress
                            value={confidence * 100}
                            className="flex-grow"
                            variant={
                              confidence > 0.7
                                ? "success"
                                : confidence > 0.4
                                ? "warning"
                                : "danger"
                            }
                          />
                          <span className="text-sm font-medium">
                            {(confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Condensed Justification Section */}
              <div className="mt-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-lg">Classification Justification</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedJustification(!expandedJustification)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {expandedJustification ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </Button>
                </div>

                <div className="mb-3">
                  <p className="text-gray-700">
                    {result.classification.is_inventory_planning
                      ? `This workbook was classified as an inventory planning file with ${(result.classification.confidence * 100).toFixed(1)}% confidence.`
                      : `This workbook was not classified as an inventory planning file.`}
                  </p>
                </div>

                {!expandedJustification ? (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-700">Key evidence:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      {getKeyEvidence(result.classification.justification).map((point, idx) => (
                        <li key={idx} className="text-gray-600">
                          {point}.
                        </li>
                      ))}
                    </ul>
                    <p className="text-sm text-gray-500 mt-2">
                      Click the expand button to see detailed justification.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 border-t pt-4">
                    <h4 className="font-medium text-gray-700 mb-2">Detailed justification:</h4>
                    <ul className="list-disc list-inside space-y-1 max-h-96 overflow-y-auto">
                      {result.classification.justification
                        .split(". ")
                        .filter(Boolean)
                        .map((reason, idx) => (
                          <li key={idx} className="text-gray-600">
                            {reason}.
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* New Data Visualization Section */}
          <Card className="w-full max-w-6xl p-6 shadow-lg rounded-xl text-left mt-6">
            <CardHeader>
              <CardTitle className="text-2xl">Data Analysis & Visualization</CardTitle>
            </CardHeader>
            <CardContent>
              <DataVisualizations
                data={result.extracted_data}
                businessType={result.classification.business_type}
                schemas={EXTRACTION_SCHEMAS}
              />
            </CardContent>
          </Card>

          {/* Extracted Data Tables */}
          <Card className="w-full max-w-3xl p-6 shadow-lg rounded-xl text-left">
            <CardHeader>
              <CardTitle className="text-2xl">Extracted Data Tables</CardTitle>
            </CardHeader>
            <CardContent>
              {["inventory_on_hand", "sales_history", "purchase_orders", "item_master"].map(
                (category) =>
                  result.extracted_data[category]?.length > 0 ? (
                    <Card key={category} className="mt-6 shadow-md overflow-hidden">
                      <CardHeader className="bg-gray-100 pb-3">
                        <div className="flex justify-between items-center">
                          <CardTitle className="capitalize text-xl flex items-center">
                            <span>{category.replace("_", " ")}</span>
                            <span className="ml-2 text-sm font-normal bg-blue-100 text-blue-800 py-0.5 px-2 rounded-full">
                              {result.extracted_data[category].length} records
                            </span>
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleMetrics(category)}
                            className="text-gray-500 hover:text-gray-700 flex items-center"
                          >
                            <BarChart2 className="h-4 w-4 mr-1" />
                            {expandedMetrics[category] ? "Hide Metrics" : "Show Metrics"}
                          </Button>
                        </div>
                      </CardHeader>

                      {/* Basic Metrics Section */}
                      {expandedMetrics[category] && (
                        <div className="bg-blue-50 p-4 border-t border-b border-blue-100">
                          <h4 className="font-medium text-blue-800 mb-2">Data Metrics:</h4>
                          {(() => {
                            const metrics = generateBasicMetrics(result.extracted_data[category]);
                            if (!metrics) return <p>No metrics available.</p>;
                            return (
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="bg-white p-3 rounded shadow-sm">
                                  <div className="text-sm text-gray-500">Total Records</div>
                                  <div className="text-2xl font-bold">{metrics.recordCount}</div>
                                </div>
                                {Object.entries(metrics.fieldCompleteness).map(([field, completeness]) => (
                                  <div key={field} className="bg-white p-3 rounded shadow-sm">
                                    <div className="text-sm text-gray-500 truncate" title={`${field} Completeness`}>
                                      {field} Coverage
                                    </div>
                                    <div className="flex items-center">
                                      <span className="text-xl font-bold">{completeness.toFixed(1)}%</span>
                                      <Progress
                                        value={completeness}
                                        className="ml-2 w-20"
                                        variant={completeness > 80 ? "success" : completeness > 50 ? "warning" : "danger"}
                                      />
                                    </div>
                                  </div>
                                ))}
                                {/* For numeric fields, show min/max/avg */}
                                {Object.entries(metrics).map(([key, value]) => {
                                  if (
                                    key !== "recordCount" &&
                                    key !== "fieldCompleteness" &&
                                    typeof value === "object"
                                  ) {
                                    return (
                                      <div key={key} className="bg-white p-3 rounded shadow-sm col-span-2 md:col-span-3">
                                        <div className="text-sm text-gray-500 mb-1">{key} Statistics</div>
                                        <div className="grid grid-cols-3 gap-2">
                                          <div>
                                            <span className="text-xs text-gray-500">Min:</span>
                                            <span className="ml-1 font-medium">{value.min.toFixed(2)}</span>
                                          </div>
                                          <div>
                                            <span className="text-xs text-gray-500">Avg:</span>
                                            <span className="ml-1 font-medium">{value.avg.toFixed(2)}</span>
                                          </div>
                                          <div>
                                            <span className="text-xs text-gray-500">Max:</span>
                                            <span className="ml-1 font-medium">{value.max.toFixed(2)}</span>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  }
                                  return null;
                                })}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-gray-100">
                                {Object.keys(result.extracted_data[category][0]).map((header, idx) => (
                                  <th
                                    key={idx}
                                    className="border px-3 py-2 text-left capitalize hover:bg-gray-200 cursor-pointer"
                                    onClick={() => sortData(category, header)}
                                  >
                                    <div className="flex items-center">
                                      <span>{header.replace("_", " ")}</span>
                                      {sortConfig.category === category && sortConfig.field === header && (
                                        <ArrowDownUp className="ml-1 h-3 w-3" />
                                      )}
                                    </div>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {getSortedData(category, result.extracted_data[category])
                                .slice(0, 10)
                                .map((row, idx) => (
                                  <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                    {Object.entries(row).map(([key, value], idx2) => {
                                      let cellClass = "border px-3 py-2 ";
                                      if (typeof value === "number") {
                                        cellClass += "text-right font-mono";
                                      } else if (typeof value === "boolean") {
                                        cellClass += "text-center";
                                      } else if (String(value).match(/^\d{4}-\d{2}-\d{2}$/)) {
                                        cellClass += "text-center font-mono text-purple-700";
                                      }
                                      return (
                                        <td key={idx + "-" + idx2} className={cellClass}>
                                          {valueDisplay(value)}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                        {result.extracted_data[category].length > 10 && (
                          <div className="text-sm text-gray-500 p-3 bg-gray-50 border-t">
                            <div className="flex items-center justify-between">
                              <div>
                                Showing first 10 of {result.extracted_data[category].length} records
                              </div>
                              <Button variant="outline" size="sm" className="text-xs">
                                View All Records
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : null
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default InventoryPlannerUI;