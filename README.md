# AI-Powered Learning Platform

This project is a dynamic, AI-driven learning platform designed to help users explore new topics. It provides AI-generated summaries, interactive flashcards, recommended videos, and a quiz to test their knowledge. The frontend is built with pure HTML, CSS, and JavaScript, and it leverages Puter.js to perform AI tasks directly in the browser. The backend is a lightweight Flask API responsible for fetching YouTube video recommendations.

## Features

-   **AI-Generated Summaries**: Enter any topic and get a concise, easy-to-read summary.
-   **Interactive Flashcards**: Key terms and definitions are automatically generated and presented as interactive, flipping flashcards.
-   **YouTube Video Recommendations**: Get a list of relevant YouTube videos to deepen your understanding.
-   **Dynamic Quizzes**: Test your knowledge with a 10-question quiz generated on the fly by an AI model.
-   **Modern, Responsive UI**: A clean and intuitive user interface that works great on both desktop and mobile devices.
-   **Serverless AI**: AI-powered features (summaries, flashcards, quizzes) are handled on the frontend using Puter.js, reducing backend load and complexity.

## Tech Stack

-   **Frontend**:
    -   HTML5
    -   CSS3 (with custom properties for theming)
    -   JavaScript (ES6+)
    -   **Puter.js**: For direct, in-browser AI model access without API keys.
-   **Backend**:
    -   Python 3
    -   Flask: For creating the video recommendation API.
    -   Gunicorn: As the production web server.
-   **APIs & Services**:
    -   Claude AI (via Puter.js)
    -   YouTube Data API

## Project Structure

```
.
├── backend/
│   ├── app.py              # Flask application
│   ├── ai_integration.py   # Handles YouTube API calls
│   ├── requirements.txt    # Python dependencies
│   └── .env.example        # Environment variable template
└── frontend/
    ├── css/
    │   └── style.css       # All custom styles
    ├── js/
    │   ├── main.js         # Logic for the main page (summary, videos, flashcards)
    │   ├── quiz.js         # Logic for the quiz page
    │   └── results.js      # Logic for the results page
    ├── index.html          # Main landing page
    ├── quiz.html           # Quiz page
    └── results.html        # Quiz results page
```

## Setup and Installation

1.  **Clone the repository**:
    ```bash
    git clone <your-repository-url>
    cd <repository-folder>
    ```

2.  **Set up the Backend**:
    -   Navigate to the `backend` directory:
        ```bash
        cd backend
        ```
    -   Create a virtual environment:
        ```bash
        python -m venv venv
        source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
        ```
    -   Install the required Python packages:
        ```bash
        pip install -r requirements.txt
        ```
    -   Create a `.env` file by copying the `.env.example` file and add your API keys:
        ```bash
        cp .env.example .env
        ```
    -   Fill in your `YOUTUBE_API_KEY` in the `.env` file.

3.  **Run the Application**:
    -   Start the backend Flask server from the `backend` directory:
        ```bash
        flask run
        ```
    -   Open the `frontend/index.html` file in your web browser. You can do this by right-clicking it and selecting "Open with Live Server" if you have the VS Code extension, or by simply opening the file directly.

## Deployment Guide

This project is designed to be deployed with a hybrid approach: the backend on **Render** and the frontend on **Netlify**.

### Step 1: Deploy the Backend to Render

1.  **Push your code** to a GitHub repository.
2.  **Sign up** at [render.com](https://render.com) and create a **New Web Service**.
3.  **Connect your GitHub repository**.
4.  **Configure the service**:
    -   **Name**: A unique name for your API (e.g., `learning-platform-api`).
    -   **Root Directory**: `backend`
    -   **Build Command**: `pip install -r requirements.txt`
    -   **Start Command**: `gunicorn app:app`
    -   **Environment Variables**: Add your `YOUTUBE_API_KEY` under the "Environment" section.
5.  **Deploy**. Once live, copy the URL provided by Render.

### Step 2: Deploy the Frontend to Netlify

1.  **Update the API URL**:
    -   In `frontend/js/main.js`, change the `API_BASE_URL` variable to your live Render URL.
    -   Commit and push this change to GitHub.
2.  **Sign up** at [netlify.com](https://netlify.com) and create a **New site from Git**.
3.  **Connect your GitHub repository**.
4.  **Configure the site**:
    -   **Base directory**: `frontend`
    -   **Publish directory**: `frontend`
    -   The build command can be left blank.
5.  **Deploy**. Your learning platform is now live!