from flask import Flask, request, jsonify
from flask_cors import CORS
import os

from ocr import extract_text
from analyzer import analyze_report, generate_summary
from database import init_db, save_report, get_reports


app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

init_db()


@app.route("/")
def home():
    return jsonify({
        "message": "Medical Report Analyzer API is running"
    })


@app.route("/analyze", methods=["POST"])
def analyze():

    if "file" not in request.files:
        return jsonify({
            "error": "No file uploaded"
        }), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({
            "error": "Please select a file"
        }), 400

    file_path = os.path.join(
        app.config["UPLOAD_FOLDER"],
        file.filename
    )

    file.save(file_path)

    try:
        text = extract_text(file_path)

        results = analyze_report(text)
        # Check whether any laboratory values were detected
        if not results:
            return jsonify({
        "success": False,
        "error": "The uploaded file is not a valid medical report. Please upload a valid medical laboratory report."
    }), 400

        summary = generate_summary(results)

        save_report(
            file.filename,
            request.form.get("patient_name", "Unknown"),
            request.form.get("report_date", ""),
            results,
            summary
        )

        return jsonify({
            "success": True,
            "filename": file.filename,
            "text": text,
            "analysis": {
                "results": results,
                "summary": summary
            }
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route("/reports", methods=["GET"])
def reports():

    try:
        return jsonify({
            "success": True,
            "reports": get_reports()
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )