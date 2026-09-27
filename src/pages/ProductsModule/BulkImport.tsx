import { useState } from "react";
import "../../styles/products-module.css";

export default function BulkImport() {
  const [importType, setImportType] = useState<"existing" | "new">("new");

  return (
    <div className="products-module-container">
      <div className="bulk-import-steps">
        <div className="step-card">
          <div className="step-header">
            <h3>Step 1 :</h3>
            <p>Download Excel File</p>
          </div>
          <div className="step-icon">
            <img src="https://cdn-icons-png.flaticon.com/512/732/732220.png" alt="Excel" />
          </div>
          <div className="step-content">
            <h4>Instruction</h4>
            <ul>
              <li>Download the format file to get the required column structure.</li>
              <li>Check the example file for accurate data input guidance.</li>
              <li>Please upload the xlsx or excel file.</li>
            </ul>
          </div>
        </div>

        <div className="step-card">
          <div className="step-header">
            <h3>Step 2 :</h3>
            <p>Match Spread sheet data according to instruction</p>
          </div>
          <div className="step-icon">
            <img src="https://cdn-icons-png.flaticon.com/512/2991/2991112.png" alt="Match" />
          </div>
          <div className="step-content">
            <h4>Instruction</h4>
            <ul>
              <li>Ensure all required columns in your Excel file are complete and match the downloaded format.</li>
              <li>Check your data before uploading to avoid errors.</li>
              <li>The system will automatically align columns during the final import.</li>
            </ul>
          </div>
        </div>

        <div className="step-card">
          <div className="step-header">
            <h3>Step 3 :</h3>
            <p>Validate data and complete import</p>
          </div>
          <div className="step-icon">
            <img src="https://cdn-icons-png.flaticon.com/512/190/190411.png" alt="Validate" />
          </div>
          <div className="step-content">
            <h4>Instruction</h4>
            <ul>
              <li>Upload your completed Excel or xlsx file using the upload tool.</li>
              <li>Review the validation report for any errors.</li>
              <li>After resolving errors, click import to finalise adding products to your store.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="download-template">
        <h3>Download Spreadsheet Template</h3>
        <div className="template-buttons">
          <button
            className={`btn-template ${importType === "existing" ? "active" : ""}`}
            onClick={() => setImportType("existing")}
          >
            With Existing Data
          </button>
          <button
            className={`btn-template ${importType === "new" ? "active" : ""}`}
            onClick={() => setImportType("new")}
          >
            Without Any Data
          </button>
        </div>
      </div>

      <div className="import-upload">
        <h3>Import items file ?</h3>
        <div className="upload-dropzone">
          <div className="dropzone-content">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17,8 12,3 7,8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p>Drag & drop <span className="link">file</span> or <span className="link">browse file</span></p>
          </div>
        </div>

        <div className="form-actions">
          <button className="btn-reset">Reset</button>
          <button className="btn-submit">Submit</button>
        </div>
      </div>
    </div>
  );
}
