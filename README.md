# OmniLearn

![OmniLearn Logo](omnilearn/logo.svg)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-3ecf8e?logo=supabase)](https://supabase.com/)
[![Powered by Gemini AI](https://img.shields.io/badge/AI-Gemini-blueviolet)](https://ai.google.dev/gemini-api)

---

## 📚 OmniLearn: Modern AI-Powered Learning Platform

OmniLearn is a full-featured, AI-powered Learning Management System (LMS) designed for learners, trainers, and administrators. It leverages Supabase for backend services and Gemini AI for smart chat, recommendations, and quiz generation.

---

## 🚀 Features

- **Learner Dashboard**: Track progress, view enrolled/completed units, take quizzes, and interact with AI.
- **Trainer Dashboard**: Create/manage courses, assignments, and monitor learner progress.
- **Admin Dashboard**: Manage users, courses, and platform settings.
- **AI Chatbot**: Get instant help, learning tips, and recommendations (Gemini API).
- **Smart Quiz Generation**: Auto-generate multiple-choice quizzes from course content.
- **Progress Tracking**: Real-time, cross-device progress sync via Supabase.
- **Assignments & Grading**: Submit, review, and grade assignments.
- **Responsive UI**: Modern, mobile-friendly design.

---

## 🛠️ Tech Stack

- **Frontend**: HTML, CSS, JavaScript (Vanilla, modular)
- **Backend**: [Supabase](https://supabase.com/) (Postgres, Auth, Storage)
- **AI Integration**: [Gemini API](https://ai.google.dev/gemini-api)
- **Other**: SVG graphics, RESTful API calls

---

## ⚡ Getting Started
### Run the project on:
https://omnilearn-project.netlify.app
#### Test user logins:
- **Admin**: email: admin@omnilearn.com  password: admin
- **Trainer**: email: trainer@omnilearn.com  password: trainer
- **Learner**: email: learner@omnilearn.com  password: learner


------------------------- OR -----------------------------
### 1. **Clone the Repository**
```bash
git clone https://github.com/yourusername/omnilearn.git
cd omnilearn
```

### 2. **Install Dependencies**
No build step required. All dependencies are loaded via CDN or included in the repo.

### 3. **Configure Environment Variables**
- **Supabase**: Set your Supabase project URL and anon/public key in `omnilearn/supabase.js`:
  ```js
  export const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY');
  ```
- **Gemini API**: Set your Gemini API key in `omnilearn/ai-service.js` and `omnilearn/learner/learner.js`:
  ```js
  const apiKey = 'YOUR_GEMINI_API_KEY';
  ```
  > **Note:** For production, use a backend proxy for Gemini API to avoid exposing your key.

### 4. **Run the App**
- Open `omnilearn/index.html` or `omnilearn/learner/index.html` in your browser.
- For full functionality, serve via a local server (e.g., VSCode Live Server, Python HTTP server):
  ```bash
  # Python 3.x
  python -m http.server 8000
  # or use any static server
  ```

---

## 📖 Usage Guide

- **Learner**: Log in, view dashboard, take quizzes, chat with AI, track progress.
- **Trainer**: Manage courses, create assignments, view learner analytics.
- **Admin**: Oversee users, courses, and platform-wide settings.
- **AI Chatbot**: Click "OmniLearn AI" in the sidebar to ask questions or get help.
- **Quiz Generation**: Start a quiz from the assignments section; questions are AI-generated from course content.

---

## 📝 Contributing

1. Fork the repo and create your branch: `git checkout -b feature/your-feature`
2. Commit your changes: `git commit -am 'Add new feature'`
3. Push to the branch: `git push origin feature/your-feature`
4. Open a Pull Request

All contributions are welcome! Please open an issue for major changes or feature requests.

---

## 📬 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/NIckeyOmbasa/omnilearn/issues)
- **Email**: ombasanickey@gmail.com

---

## 📝 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details. 
