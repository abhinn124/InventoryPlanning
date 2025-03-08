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

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const data = await uploadFile(file);
      setResult(data);
    } catch (error) {
      console.error("Error during file upload:", error);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-8 bg-gray-50 min-h-screen font-raleway text-gray-900 text-center">
      <h1 className="text-4xl font-bold">Inventory Planner</h1>
      <p className="text-lg text-gray-600">Automating Your Workbook Checks</p>

      <Card className="w-full max-w-2xl p-6 shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Upload Your Workbook</CardTitle>
        </CardHeader>
        <CardContent>
          <input
            type="file"
            accept=".xlsx, .csv"
            onChange={(event) => setFile(event.target.files[0])}
            className="border p-3 rounded-lg w-full mb-4 text-center"
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

      {result && result.classification && (
        <Card className="w-full max-w-2xl p-6 shadow-lg rounded-xl text-left result-text">
          <CardHeader>
            <CardTitle className="text-2xl">Result Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4 text-lg">
              {result.classification.is_inventory_planning ? (
                <CheckCircle className="text-green-500 h-6 w-6" />
              ) : (
                <XCircle className="text-red-500 h-6 w-6" />
              )}
              <span className="font-semibold">Inventory Planning File:</span>
              <span>{result.classification.is_inventory_planning ? "Yes" : "No"}</span>
            </div>

            <div>
              <span className="font-semibold">Confidence:</span>
              <Progress value={result.classification.confidence * 100} className="mt-2" />
              <span className="text-lg text-gray-700 font-semibold">
                {(result.classification.confidence * 100).toFixed(1)}%
              </span>
            </div>

            <div>
              <span className="font-semibold">Justification:</span>
              <ul className="mt-3 text-base list-disc list-inside space-y-1">
                {result.classification.justification
                  .split(". ")
                  .filter(Boolean)
                  .map((reason, idx) => (
                    <li key={idx}>{reason}.</li>
                  ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InventoryPlannerUI;
