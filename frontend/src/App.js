import React, { useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import "./App.css";

const API = "http://127.0.0.1:5000";

function App() {
  const [file, setFile] = useState(null);
  const [patientName, setPatientName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [reportDate, setReportDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const analyzeReport = async () => {
    if (!file) {
      setError("Please select a medical report first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("patient_name", patientName);
    formData.append("report_date", reportDate);
    console.log("Report Date:", reportDate);
    try {
      const response = await axios.post(
        `${API}/analyze`,
        formData
      );

      setResult(response.data.analysis);
      console.log("ANALYSIS RESULT:", response.data.analysis);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.error ||
        "Unable to analyze the report. Please check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };
    const loadHistory = async () => {
    try {
      const response = await axios.get(`${API}/reports`);
      setHistory(response.data.reports || []);
    } catch (err) {
      console.error("History error:", err);
    }
  };

  const toggleHistory = () => {
    if (!showHistory) {
      loadHistory();
    }

    setShowHistory(!showHistory);
  };

  const downloadReport = () => {
    if (!result) return;

    let text = "MEDICAL REPORT ANALYZER\n";
    text += "========================\n\n";

    text += `Patient Name: ${patientName || "Unknown"}\n`;
    text += `Report Date: ${reportDate || "Not provided"}\n\n`;

    text += "LABORATORY VALUES\n";
    text += "-----------------\n\n";

    if (result.results) {
      result.results.forEach((item) => {
        text += `Test: ${item.test || "Unknown"}\n`;
        text += `Value: ${item.value || ""} ${item.unit || ""}\n`;
        text += `Reference Range: ${
          item.reference_range || "Not provided"
        }\n`;
        text += `Status: ${item.status || "Normal"}\n\n`;
      });
    }

    text += "PATIENT-FRIENDLY SUMMARY\n";
    text += "------------------------\n";
    text += `${result.summary || "No summary available."}\n\n`;

    text += "MEDICAL DISCLAIMER\n";
    text += "------------------\n";
    text +=
      "This system provides informational analysis only and is not a medical diagnosis. Please consult a qualified healthcare professional for medical advice.\n";

    const blob = new Blob([text], {
      type: "text/plain",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "medical_report_analysis.txt";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const clearReport = () => {
  setFile(null);
  setPatientName("");
  setReportDate("");
  setResult(null);
  setError("");
  setSearchTerm("");
  setStatusFilter("All");
};

  const getStatusClass = (status) => {
    if (!status) return "normal";

    const value = status.toLowerCase();

    if (value.includes("critical")) {
      return "critical";
    }

    if (
      value.includes("high") ||
      value.includes("low") ||
      value.includes("abnormal")
    ) {
      return "warning";
    }

    return "normal";
  };

  const totalTests = result?.results?.length || 0;

  const normalTests =
    result?.results?.filter(
      (item) =>
        item.status?.toLowerCase() === "normal"
    ).length || 0;

  const abnormalTests = totalTests - normalTests;

  const filteredResults = (result?.results || []).filter((item) => {
  const matchesSearch = item.test
    ?.toLowerCase()
    .includes(searchTerm.toLowerCase());

  const status = item.status?.toLowerCase() || "normal";

  const matchesStatus =
    statusFilter === "All" ||
    (statusFilter === "Normal" && status === "normal") ||
    (statusFilter === "Attention" && status !== "normal");

  return matchesSearch && matchesStatus;
});

  return (
    <div className="app">

      <header className="header">

        <div className="header-content">

          <div>
            <h1>🩺 Medical Report Analyzer</h1>

            <p>
              AI-assisted medical report analysis using OCR
            </p>
          </div>

          <button
              className="history-btn"
              onClick={toggleHistory}
          >
              📋 Report History
          </button>

          <div className="header-badge">
            AI Powered
          </div>

        </div>

      </header>

      <main className="container">

        {showHistory && (
  <section className="history-section">

    <div className="history-title">
      <div>
        <h2>📋 Report History</h2>
        <p>Previously analyzed medical reports</p>
      </div>

      <button
        className="close-history"
        onClick={() => setShowHistory(false)}
      >
        ✕
      </button>
    </div>

    {history.length === 0 ? (
      <div className="empty-history">
        No reports have been analyzed yet.
      </div>
    ) : (
      <div className="history-list">

        {history.map((report) => (
          <div
            className="history-card"
            key={report.id}
          >

            <div className="history-file">
              📄
            </div>

            <div className="history-info">

              <h3>
                {report.filename || "Medical Report"}
              </h3>

              <p>
                Patient: {report.patient_name || "Unknown"}
              </p>

              <p>
                Date: {report.report_date || "Not provided"}
              </p>

            </div>

            <div className="history-count">

              <strong>
                {report.results?.length || 0}
              </strong>

              <span>
                Tests
              </span>

            </div>

          </div>
        ))}

      </div>
    )}

  </section>
)}

        <section className="upload-card">

          <h2>Upload Medical Report</h2>

          <p className="subtitle">
            Upload a PDF, JPG, JPEG or PNG medical laboratory report
          </p>

          <div className="upload-box">

            <div className="upload-icon">
              📄
            </div>

            <h3>
              Select your medical report
            </h3>

            <p>
              Supported formats: PDF, JPG, JPEG, PNG
            </p>

            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                const selectedFile = e.target.files[0];

                setFile(selectedFile);
                setError("");
                setResult(null);
              }}
            />

            {file && (
              <div className="selected-file">
                ✓ {file.name}
              </div>
            )}

          </div>

          <div className="patient-fields">

            <div className="field">

              <label>
                Patient Name
              </label>

              <input
                type="text"
                placeholder="Enter patient name"
                value={patientName}
                onChange={(e) =>
                  setPatientName(e.target.value)
                }
              />

            </div>

            <div className="field">

              <label>
                Report Date
              </label>

              <input
                type="date"
                value={reportDate}
                onChange={(e) =>
                  setReportDate(e.target.value)
                }
              />

            </div>

          </div>

          <button
            className="analyze-btn"
            onClick={analyzeReport}
            disabled={loading}
          >

            {loading
              ? "⏳ Analyzing Report..."
              : "🔍 Analyze Report"}

          </button>

          {error && (
            <div className="error">
              ⚠️ {error}
            </div>
          )}

        </section>

        {result && (

          <section className="result-section">

            <div className="result-header">

              <div>

                <h2>
                  Analysis Results
                </h2>

                <p>
                  Extracted laboratory information
                </p>

              </div>

              <span className="ai-badge">
                ✓ AI Analysis
              </span>

            </div>

            <button
              onClick={downloadReport}
              className="download-btn"
            >
              ⬇️ Download Report
            </button>

            <button
              onClick={clearReport}
              className="clear-btn"
              >
              🔄 New Report
            </button>

            <div className="stats-grid">

              <div className="stat-card">

                <div className="stat-icon">
                  🧪
                </div>

                <div className="health-overview">

  <div className="overview-header">
    <div>
      <h3>📊 Health Report Overview</h3>
      <p>Summary of detected laboratory values</p>
    </div>
  </div>

  <div className="progress-item">
    <div className="progress-label">
      <span>Normal Results</span>
      <strong>{normalTests} / {totalTests}</strong>
    </div>

    <div className="progress-bar">
      <div
        className="progress-normal"
        style={{
          width: `${totalTests ? (normalTests / totalTests) * 100 : 0}%`
        }}
      ></div>
    </div>
  </div>

  <div className="progress-item">
    <div className="progress-label">
      <span>Attention Needed</span>
      <strong>{abnormalTests} / {totalTests}</strong>
    </div>

    <div className="progress-bar">
      <div
        className="progress-attention"
        style={{
          width: `${totalTests ? (abnormalTests / totalTests) * 100 : 0}%`
        }}
      ></div>
    </div>
  </div>

</div>

                <div className="chart-card">

  <div className="section-title">
    <span>📊</span>
    <h3>Results Overview</h3>
  </div>

  <ResponsiveContainer width="100%" height={280}>
    <BarChart
      data={[
        {
          name: "Normal",
          value: normalTests
        },
        {
          name: "Attention",
          value: abnormalTests
        }
      ]}
    >
      <XAxis dataKey="name" />
      <YAxis allowDecimals={false} />
      <Tooltip />
      <Bar dataKey="value" />
    </BarChart>
  </ResponsiveContainer>

</div>

                <div>
                  <h3>{totalTests}</h3>
                  <p>Total Tests</p>
                </div>

              </div>

              <div className="stat-card normal-stat">

                <div className="stat-icon">
                  ✓
                </div>

                <div>
                  <h3>{normalTests}</h3>
                  <p>Normal</p>
                </div>

              </div>

              <div className="stat-card warning-stat">

                <div className="stat-icon">
                  !
                </div>

                <div>
                  <h3>{abnormalTests}</h3>
                  <p>Attention Needed</p>
                </div>

              </div>

            </div>

            <div className="summary-card">

              <div className="section-title">

                <span>📝</span>

                <h3>
                  Patient-Friendly Summary
                </h3>

              </div>

              <p>
                {result.summary ||
                  "No summary was generated."}
              </p>

            </div>

            <div className="values-header">

              <div>

                <h2>
                  Laboratory Values
                </h2>

                <p>
                  Detected values and reference ranges
                </p>

              </div>

            </div>

            <div className="results-controls">

  <input
    type="text"
    placeholder="🔎 Search laboratory test..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="search-input"
  />

  <select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
    className="filter-select"
  >
    <option value="All">All Results</option>
    <option value="Normal">Normal</option>
    <option value="Attention">Attention Needed</option>
  </select>

</div>

            <div className="results-grid">

                  {filteredResults.map(
                  (item, index) => (

        <div
  className="result-card"
  key={index}
>

  <div className="card-top">

    <div className="test-name">
      {item.test}
    </div>

    <div
      className={`status ${getStatusClass(item.status)}`}
    >
      {item.status || "Normal"}
    </div>

  </div>

  <div className="test-value">

    {item.value}{" "}

    <span>
      {item.unit}
    </span>

  </div>

  <div className="reference">

    <span>
      Reference Range
    </span>

    <strong>
      {item.reference_range}
    </strong>

  </div>
</div>

  )
)}

</div>

</section>

)}

</main>


      <footer>

        <p>
          Medical Report Analyzer © 2026
        </p>

      </footer>

    </div>
  );
}

export default App;