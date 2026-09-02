"""
StudyMate AI - Flask Backend
-----------------------------
Serves the frontend and exposes a single API endpoint (/api/generate)
that receives student content + a study mode, builds a prompt, and
calls the AI service to get an LLM-generated response.
"""

from flask import Flask, render_template, request, jsonify
from services.ai_service import generate_ai_response, AIServiceError

app = Flask(__name__)

# Valid study modes supported by the app
VALID_MODES = {"summarize", "explain", "improve"}

# Input length limits
MIN_INPUT_LENGTH = 10
MAX_INPUT_LENGTH = 6000


@app.route("/")
def index():
    """Serve the main page."""
    return render_template("index.html")


@app.route("/api/generate", methods=["POST"])
def generate():
    """
    Main API endpoint.

    Expects JSON:
        { "mode": "summarize" | "explain" | "improve", "content": "<text>" }

    Returns JSON:
        { "success": true, "response": "<ai text>" }
        or
        { "success": false, "error": "<friendly message>" }
    """
    # 1. Make sure we actually received JSON
    data = request.get_json(silent=True)
    if not data:
        return jsonify(success=False, error="Invalid request format."), 400

    mode = (data.get("mode") or "").strip().lower()
    content = (data.get("content") or "").strip()

    # 2. Validate mode
    if mode not in VALID_MODES:
        return jsonify(success=False, error="Please select a valid study mode."), 400

    # 3. Validate content - empty
    if not content:
        return jsonify(success=False, error="Please enter some content first."), 400

    # 4. Validate content - too short
    if len(content) < MIN_INPUT_LENGTH:
        return jsonify(success=False, error="Please provide a little more content."), 400

    # 5. Validate content - too long
    if len(content) > MAX_INPUT_LENGTH:
        return jsonify(
            success=False,
            error=f"Your input is too long. Please limit it to {MAX_INPUT_LENGTH} characters.",
        ), 400

    # 6. Call the AI service
    try:
        ai_response = generate_ai_response(mode, content)
        return jsonify(success=True, response=ai_response)
    except AIServiceError as e:
        # Known, friendly error raised by our AI service layer
        return jsonify(success=False, error=str(e)), 502
    except Exception:
        # Catch-all so we never leak a stack trace to the client
        return jsonify(
            success=False,
            error="Something went wrong on our end. Please try again.",
        ), 500


if __name__ == "__main__":
    app.run(debug=True)
