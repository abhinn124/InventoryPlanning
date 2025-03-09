import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Progress } from "./ui/Progress";
import { Button } from "./ui/Button";
import { UploadCloud, CheckCircle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { uploadFile } from "../services/api";

const InventoryPlannerUI = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    try {
      const data = await uploadFile(file);
      setResult(data);
    } catch (error) {
      console.error("Error during file upload:", error);
      setError("Failed to process file. Please try again.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const valueDisplay = (value) => (value !== null && value !== undefined ? value.toString() : "");

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

      {error && (
        <div className="text-red-500 text-lg font-semibold mt-4">{error}</div>
      )}

      {result && result.classification && (
        <Card className="w-full max-w-3xl p-6 shadow-lg rounded-xl text-left">
          <CardHeader>
            <CardTitle className="text-2xl">Result Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 text-lg">
              {result.classification.is_inventory_planning ? (
                <CheckCircle className="text-green-500" />
              ) : (
                <XCircle className="text-red-500" />
              )}
              <span className="font-semibold">Inventory Planning File:</span>
              <span>{result.classification.is_inventory_planning ? "Yes" : "No"}</span>
            </div>

            <div>
              <span className="font-semibold">Confidence:</span>
              <Progress value={result.classification.confidence * 100} className="mt-2" />
              <span className="text-lg font-semibold">
                {(result.classification.confidence * 100).toFixed(1)}%
              </span>
            </div>

            <div>
              <span className="font-semibold">Justification:</span>
              <ul className="mt-3 list-disc list-inside space-y-1">
                {result.classification.justification
                  .split(". ")
                  .filter(Boolean)
                  .map((reason, idx) => (
                    <li key={idx}>{reason}.</li>
                  ))}
              </ul>
            </div>

            {/* Display extracted data visually */}
            {["inventory_on_hand", "sales_history", "purchase_orders", "item_master"].map((category) =>
              result.extracted_data[category]?.length > 0 ? (
                <Card key={category} className="mt-4 shadow-md">
                  <CardHeader>
                    <CardTitle className="capitalize text-xl">
                      {category.replace("_", " ")} ({result.extracted_data[category].length} records)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          {Object.keys(result.extracted_data[category][0]).map((header, idx) => (
                            <th key={idx} className="border px-3 py-2 bg-gray-100 capitalize">
                              {header.replace("_", " ")}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.extracted_data[category].slice(0, 10).map((row, idx) => (
                          <tr key={idx}>
                            {Object.values(row).map((value, idx2) => (
                              <td key={idx + "-" + idx2} className="border px-3 py-2">
                                {valueDisplay(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {result.extracted_data[category].length > 10 && (
                      <div className="text-sm text-gray-500 mt-2">
                        Showing first 10 records...
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : null
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InventoryPlannerUI;
