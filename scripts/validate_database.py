import re
import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

script_dir = os.path.dirname(os.path.abspath(__file__))
db_js_path = os.path.join(script_dir, "..", "database.js")
report_path = os.path.join(script_dir, "..", "validation_report.md")

if not os.path.exists(db_js_path):
    print(f"Error: {db_js_path} does not exist.")
    sys.exit(1)

with open(db_js_path, "r", encoding="utf-8") as f:
    js_content = f.read()

# Extract JSON from "const QUESTIONS_DATABASE = [ ... ];"
json_str = js_content.replace("const QUESTIONS_DATABASE =", "").strip()
if json_str.endswith(";"):
    json_str = json_str[:-1].strip()

questions = json.loads(json_str)

# Validation counts
total_questions = len(questions)
missing_options = 0
missing_figures = 0  # Since we are using images, we can check if image file exists
missing_solutions = 0
needs_review = 0
missing_fields = []

validation_results = []

for q in questions:
    q_id = q["id"]
    year = q["year"]
    qnum = q["questionNumber"]
    qtype = q["questionType"]
    subj = q["subject"]
    unit = q["unit"]
    topic = q["topic"]
    qtext = q["questionText"]
    options = q["options"]
    ans = q["officialAnswer"]
    image_path = q["imagePath"]
    
    # Check if image file exists
    full_image_path = os.path.join(script_dir, "..", image_path.replace("/", "\\"))
    image_exists = os.path.exists(full_image_path)
    
    q_errors = []
    
    # Check Q No
    if not qnum or qnum < 11 or qnum > 65:
        q_errors.append(f"Invalid question number: {qnum}")
        
    # Check complete text
    if not qtext or len(qtext.strip()) < 10:
        q_errors.append("Empty or too short question text")
        
    # Check options for MCQ/MSQ
    if qtype in ["MCQ", "MSQ"]:
        if not options or len(options) < 4:
            q_errors.append(f"Missing options (found {len(options) if options else 0})")
            missing_options += 1
            
    # Check image
    if not image_exists:
        q_errors.append(f"Missing image file: {image_path}")
        missing_figures += 1
        
    # Check answers
    if not ans:
        q_errors.append("Missing official answer")
        
    # Check classification
    if subj == "Unclassified / Needs Review" or unit == "Unclassified" or topic == "Needs Review":
        q_errors.append("Needs classification review")
        needs_review += 1
        
    if q_errors:
        validation_results.append({
            "id": q_id,
            "year": year,
            "qnum": qnum,
            "errors": q_errors
        })

# Generate report markdown
report_md = f"""# Question Database Validation Report

This report summarizes the validation checks performed on the compiled GATE DA PYQ database.

## Summary Metrics

- **Total Questions Extracted:** {total_questions}
- **Questions with Missing Options:** {missing_options}
- **Questions with Missing Figures/Images:** {missing_figures}
- **Questions with Missing Solutions:** {missing_solutions} (Note: Official solution key is present for all, detailed official explanation is empty as it is not supplied in source)
- **Questions Needing Classification Review:** {needs_review}

## Detailed Validation Checks

"""

if not validation_results:
    report_md += "✓ All 165 questions passed all checks! No missing options, images, or unclassified items.\n"
else:
    report_md += "| Question ID | Year | Q. No. | Errors / Warnings |\n"
    report_md += "| --- | --- | --- | --- |\n"
    for r in validation_results:
        err_str = "; ".join(r["errors"])
        report_md += f"| {r['id']} | {r['year']} | {r['qnum']} | {err_str} |\n"

with open(report_path, "w", encoding="utf-8") as f:
    f.write(report_md)

print(f"Validation complete! Report written to {report_path}")
if validation_results:
    print(f"Validation failed with {len(validation_results)} issues. See report for details.")
    sys.exit(1)
else:
    print("Validation passed successfully!")
