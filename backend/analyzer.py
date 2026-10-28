import re


# Common laboratory tests and their normal ranges
REFERENCE_RANGES = {
    "hemoglobin": (12.0, 16.0, "g/dL"),
    "glucose": (70.0, 100.0, "mg/dL"),
    "white blood cells": (4000.0, 11000.0, "/µL"),
    "wbc": (4000.0, 11000.0, "/µL"),
    "platelets": (150000.0, 450000.0, "/µL"),
    "total cholesterol": (0.0, 200.0, "mg/dL"),
    "tsh": (0.4, 4.0, "mIU/L"),
}


def clean_number(value):
    value = value.replace(",", "")
    return float(value)


def get_status(value, low, high):
    if value < low:
        difference = low - value

        if difference > low * 0.20:
            return "Critical Low"

        return "Low"

    if value > high:
        difference = value - high

        if difference > high * 0.20:
            return "Critical High"

        return "High"

    return "Normal"


def analyze_report(text):

    results = []

    text_lower = text.lower()

    # Check every supported laboratory test
    for test_name, (low, high, unit) in REFERENCE_RANGES.items():

        if test_name not in text_lower:
            continue

        # Find the test name and a nearby number
        pattern = (
            re.escape(test_name)
            + r".{0,80}?"
            + r"(\d+(?:,\d{3})*(?:\.\d+)?)"
        )

        match = re.search(
            pattern,
            text_lower,
            re.IGNORECASE | re.DOTALL
        )

        if not match:
            continue

        try:
            value = clean_number(match.group(1))
        except ValueError:
            continue

        status = get_status(value, low, high)

        results.append({
            "test": test_name.title(),
            "value": value,
            "unit": unit,
            "reference_range": f"{low} - {high}",
            "status": status
        })

    return results


def generate_summary(results):

    if not results:
        return (
            "No supported laboratory values were detected. "
            "Please upload a clearer report."
        )

    normal = []
    abnormal = []

    for item in results:

        if item["status"] == "Normal":
            normal.append(item["test"])

        else:
            abnormal.append(
                f'{item["test"]} is {item["status"].lower()} '
                f'({item["value"]} {item["unit"]})'
            )

    summary = []

    if normal:
        summary.append(
            "The following values are within the reference range: "
            + ", ".join(normal) + "."
        )

    if abnormal:
        summary.append(
            "Attention is recommended for: "
            + "; ".join(abnormal) + "."
        )

    summary.append(
        "These results are informational and should be interpreted "
        "by a qualified healthcare professional."
    )

    return " ".join(summary)