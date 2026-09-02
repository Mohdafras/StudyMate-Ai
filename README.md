# StudyMate AI

An AI-powered study companion for students. Paste your notes, a concept, or an
exam answer, and get an AI-generated summary, explanation, or improved version
back — right in the browser.

## Overview

StudyMate AI is a beginner-level, full-stack web application built with
Flask (Python) on the backend and plain HTML/CSS/JavaScript on the frontend.
It integrates with an Google Gemini-compatible LLM API to provide three focused
study utilities.

## Problem Statement

Students often struggle to:
- Digest long lecture notes quickly before an exam
- Understand technical concepts explained in a confusing way
- Know whether a written answer is strong enough for an exam or interview

Doing all three usually means switching between several tools or asking
a friend/tutor. StudyMate AI puts all three in one simple interface.

## Objective

Build a simple, reliable, and explainable AI tool that solves a real student
problem, using a beginner-friendly stack (Flask + vanilla JS), with proper
prompt design, input validation, and error handling — without unnecessary
complexity (no databases, no auth, no RAG/embeddings, no heavy frameworks).

## Features

- **Summarize Notes** — condenses long notes into a summary, key points, and
  important terms.
- **Explain Concept** — explains any topic with a definition, how it works,
  a real-world example, a simple example, and a key takeaway.
- **Improve Answer** — rewrites a student's answer into a stronger version,
  with feedback on what was weak and suggestions for improvement.
- Character counter, clear/generate buttons, loading indicator, and a
  "Copy Response" button.
- Friendly validation and error messages (no raw stack traces).

## Technology Stack

**Backend:** Python, Flask
**Frontend:** HTML5, CSS3, vanilla JavaScript (no frontend framework)
**AI:** Google Gemini-compatible Chat Completions API (via the official `google-genai`
Python SDK), configured through environment variables so the provider can
be swapped later without touching the rest of the app.

## System Architecture

```
User
  ↓
Web Interface (HTML/CSS/JS)
  ↓
Flask Backend (app.py)
  ↓
Prompt Builder (services/ai_service.py)
  ↓
LLM API (Google Gemini-compatible)
  ↓
AI Response
  ↓
Web Interface
```

The frontend never talks to the LLM API directly. It only calls the Flask
backend's own `/api/generate` endpoint. The backend is the only place that
holds the API key and knows how to talk to the AI provider.

## How It Works

1. The student opens the app and picks one of three modes (cards on the
   home screen).
2. The workspace shows a textarea for that mode, with a live character
   counter.
3. The student types or pastes content and clicks **Generate**.
4. The frontend validates the input (not empty, not too short, not too
   long) before sending anything to the server.
5. The frontend sends a `POST` request to `/api/generate` with the
   selected `mode` and `content`.
6. Flask re-validates the request server-side (never trust the client
   alone), then passes the mode + content to `services/ai_service.py`.
7. `ai_service.py` picks the prompt template for that mode, fills in the
   student's content, and calls the LLM API.
8. The AI's response is returned to Flask, which sends it back to the
   browser as JSON.
9. The frontend renders the response with headings/bullets and shows a
   "Copy Response" button.

## Prompt Engineering Approach

Every mode uses a two-part **system + user** message structure (the
standard Chat Completions pattern):

- **System instruction** — sets the AI's role and general behavior for
  that mode (e.g. *"You are a patient AI tutor helping college students
  understand technical concepts."*). This stays constant per mode and is
  never shown to or edited by the user.
- **User content** — a template that combines:
  - **Task-specific instructions** (what to produce, and in what order)
  - **Output format** (explicit headings like `## Simple Definition`,
    so the response is easy to parse and display)
  - **The student's actual input**, inserted into the template

All three prompt templates live in one place, `services/ai_service.py`, in
a `PROMPTS` dictionary keyed by mode. This keeps prompt design isolated
from request handling, so a prompt can be tuned without touching `app.py`
or the frontend at all.

## Input Validation

Performed on **both** the frontend and backend (defense in depth):

- Empty input → `"Please enter some content first."`
- Too short (under 10 characters) → `"Please provide a little more content."`
- Too long (over 6000 characters) → a friendly length-limit message
- Invalid/missing mode → rejected with a clear error
- The **Generate** button is disabled while a request is in flight, to
  prevent duplicate submissions.

## Error Handling

The backend distinguishes between failure types and always returns a
friendly `error` message in JSON — never a raw exception or stack trace:

| Situation                     | Response                                          |
|--------------------------------|----------------------------------------------------|
| Missing/invalid API key        | "AI service authentication failed..."             |
| Rate limit hit                 | "...receiving too many requests right now..."     |
| Request timed out               | "...took too long to respond..."                  |
| Network/connection failure      | "Could not connect to the AI service..."          |
| Unexpected/empty AI response    | "...unexpected response from the AI service."     |
| Any other server-side error     | "Something went wrong on our end..."              |

The frontend shows these messages in a dedicated error card and never
crashes the page.

## Security

The API key is **only** read from a `.env` file on the server via
`python-dotenv` + `os.getenv`, and is only ever used inside
`services/ai_service.py`. It is:

- Never hardcoded anywhere in the source code
- Never sent to, or accessible from, the frontend JavaScript
- Never logged or included in error messages returned to the client
- Excluded from version control via `.gitignore`

Environment variables keep secrets out of source code, so the same
codebase can be shared, committed to GitHub, or deployed without ever
exposing the real key. Only `.env.example` (a template with a placeholder)
is committed.

## Installation

```bash
# 1. Create and activate a virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Create your .env file
cp .env.example .env      # macOS/Linux
copy .env.example .env    # Windows

# 4. Edit .env and add your real API key
```

## Running the App

```bash
python app.py
```

Then open:

```
http://127.0.0.1:5000
```

## API Configuration

Open `.env` and set:

```
GEMINI_API_KEY=your_real_api_key_here
```

Optional — only needed if you want to point at a different
Google Gemini-compatible provider or model:

```
GEMINI_MODEL=https://api.google-genai.com/v1
GEMINI_MODEL=gemini-2.5-flash
```

Because the provider configuration lives entirely in `ai_service.py` and
environment variables, switching providers later does not require
changing `app.py`, the prompts, or the frontend.

## Project Structure

```
studymate-ai/
│
├── app.py                 # Flask app, routes, request validation
├── requirements.txt
├── .env.example
├── .gitignore
├── README.md
│
├── templates/
│   └── index.html          # Single-page UI
│
├── static/
│   ├── style.css            # Visual design
│   └── script.js            # Mode switching, validation, API calls
│
└── services/
    ├── __init__.py
    └── ai_service.py        # Prompt templates + LLM API integration
```

## Future Improvements

*(Not implemented — listed for context only)*

- Quiz generation from notes
- Study history / saved sessions
- PDF upload support
- Voice input
- Personalized study plans based on past activity
