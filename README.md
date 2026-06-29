# 🎙️ SpeechRecognition - Voice to Insight

**A modern web-based application that converts speech into text, translates it across multiple languages, and analyzes sentiment — all in one seamless experience.**

![Python](https://img.shields.io/badge/Python-3.11%2B-blue) 
![Flask](https://img.shields.io/badge/Flask-Framework-orange)

---

## ✨ Key Features

- **🎤 Speech Recognition** — Accurately converts spoken audio into text using powerful Python libraries.
- **🌐 Multi-Language Translation** — Real-time translation supporting **English 🇬🇧**, **Japanese 🇯🇵 (日本語)**, **French 🇫🇷 (Français)**, **Korean 🇰🇷 (한국어)**, Spanish 🇪🇸, German 🇩🇪, and **100+ more languages**.
- **😊 Sentiment Analysis** — Detects emotions (positive, negative, neutral) using advanced NLP models from Hugging Face Transformers.
- **🔊 Text-to-Speech** — Converts text back to natural-sounding speech for accessibility.
- **📊 Word Error Rate (WER)** — Measures transcription accuracy with jiwer.
- **🔐 User Authentication** — Secure login and registration system.
- **📱 Beautiful Responsive UI** — Modern design with smooth navigation and Boxicons.

---

## 🌍 Supported Languages

| Language       | Flag   | Native Name       | Code |
|----------------|--------|-------------------|------|
| English        | 🇬🇧    | English           | en   |
| Japanese       | 🇯🇵    | 日本語             | ja   |
| French         | 🇫🇷    | Français          | fr   |
| Korean         | 🇰🇷    | 한국어             | ko   |
| Spanish        | 🇪🇸    | Español           | es   |
| German         | 🇩🇪    | Deutsch           | de   |
| **and 100+ more** | 🌐   | —              | —    |

---

## 🛠️ Technologies Used

### Frontend
- HTML5, CSS3, JavaScript
- Boxicons for stylish icons

### Backend
- **Python 3.11+** (Recommended)
- Flask (Web Framework)
- SpeechRecognition
- deep-translator
- Hugging Face Transformers
- pyttsx3 (Offline Text-to-Speech)
- jiwer (Word Error Rate)

---

## 📋 Typical Workflow

1. **Register / Login** → Create account or sign in securely 🔑
2. **Record or Upload Audio** → Speak directly via microphone 🎤 or upload file
3. **AI Processing** → 
   - Speech → Text
   - Translation to desired language (🇯🇵 🇫🇷 🇰🇷 etc.)
   - Sentiment Analysis 😊
   - Accuracy Check (WER) 📊
4. **View Results** → Text, translation, sentiment, and listen to synthesized voice 🔊

---

## 💻 Web Interface Highlights

- 🏠 **Home** — Welcoming landing page
- ℹ️ **About** — Project details and features
- 🛠️ **Services** — Core features: Speech Recognition, Translation & Sentiment Analysis
- 📞 **Contact** — Get in touch
- 🔑 Login & Registration pages
- Social media integration (Instagram, X, LinkedIn, GitHub)
- Fully responsive & mobile-friendly modern design

---



## 📅 Changelog & Project Milestones (June 2026)

### **June 10, 2026 (11:50 AM)**
- **Initial Setup**: Configured basic structure of the SpeechRecognition application and initial project documentation.

### **June 12, 2026 (08:26 AM)**
- **Identified Bugs & Roadmaps**: Logged microphone input detection issues on local environments and outlined appearance enhancement roadmaps to replace outdated layouts.

### **June 27, 2026 (09:24 PM)**
- **UI Framework Upgrade**: Introduced a new **Vite-based React** frontend client (`frontend/`), implementing a glassmorphic dashboard layout with real-time UI controls.
- **Database & Session Sync**: Integrated an **SQLite3 database (`audiofy.db`)** to persist registration, login, and user profile data securely.

### **June 29, 2026 (02:20 PM)**
- **Audio Processing & FFmpeg Robustness**: Installed `static-ffmpeg` and set up paths dynamically inside the transcription pipeline. Integrated `pydub` fallback to convert compressed audio formats (like MP3) to standard mono PCM WAV files, correcting all previous transcription errors.
- **Flask Clean Routing & Page Protection**: Enforced clean URL routes (`/dashboard`, `/about`, `/services`, `/contact`) on the backend. Secured sensitive user panels so that guests are automatically routed to the login page (`/`).
- **Bridged Multi-Frontend Flow**: Fully bridged the static entry login page (`/`) on port 5000 with the built production React client served at `/dashboard`, solving all previous port and CORS mismatch issues.
- **Expanded Translations**: Added **Japanese (日本語)**, **Korean (한국어)**, and **Chinese (Mandarin / zh-CN)** options to the audio language and translation selectors in both the static forms and the React dashboard.
- **Fixed Document Exports**: Corrected the client-side document export logic. Added API connections to the ReportLab/Python-Docx backend engines to download valid, uncorrupted PDF and DOCX reports containing the original transcription, translations, and summaries.
- **Vibrant Cyberpunk Theme**: Added a moving cyber-particles canvas background (cyan/magenta/purple connections) to the login interface, a neon water droplets rain effect to the dashboard, and intense neon glows to all buttons and inputs.
- **Unicode Terminal Safety**: Redefined stream printing inside Python to handle Hindi, Japanese, and Korean character printing safely on Windows terminals.
