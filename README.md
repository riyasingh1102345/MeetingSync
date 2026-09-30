# MeetLens AI 🎥✨

**Live Demo:** [https://meetlens-ai.vercel.app](https://meetlens-ai.vercel.app)

MeetLens AI is a meeting intelligence platform I built to help teams get more out of their conversations. Instead of just recording videos or taking basic notes, it combines live video conferencing with AI to automatically generate transcripts, minute-by-minute timelines, summaries, and action items. 

It also includes a ChatGPT-style assistant that lets you "chat" with your past meetings to pull up specific details instantly.

---

## ✨ Features

* 🎥 **Live Meetings** — Full video conferencing (camera, mic, screen sharing) built with Jitsi/WebRTC.
* 📝 **Smart Transcription** — High-accuracy speech-to-text with automatic speaker detection (Speaker A, Speaker B) using AssemblyAI.
* ⏱️ **Meeting Timelines** — Automatically breaks down long meetings into chronological, minute-by-minute summaries.
* 📌 **Instant Summaries & Action Items** — AI automatically extracts key decisions and tasks with deadlines.
* 💬 **AI Meeting Assistant** — Ask natural-language questions about your meeting history (e.g., "What did we decide about the new marketing budget?").
* 📤 **File Upload** — Skip the live meeting and just upload existing audio/video recordings for analysis.

---

## 💻 Tech Stack

This is built as a modern, serverless web application to ensure fast load times and easy scalability without needing to manage a custom backend server.

**Frontend:**
* React 19 + Vite
* React Router
* Tailwind CSS
* Lucide Icons

**Backend & Database:**
* Firebase Authentication (Google OAuth + Email/Password)
* Firebase Firestore (NoSQL database for storing meeting metadata and transcripts)

**AI & Media Services:**
* **Google Gemini AI** — Powers the summaries, timelines, action items, and conversational chat.
* **AssemblyAI** — Handles speech-to-text and speaker diarization.
* **Jitsi / WebRTC** — Powers the live video conferencing infrastructure.

**Deployment:**
* Vercel

---

## ⚙️ How It Works Behind the Scenes

1. You conduct a live meeting or upload a recording.
2. AssemblyAI processes the audio to generate a raw transcript and detects who is speaking when.
3. The raw data is saved to Firebase Firestore.
4. Google Gemini analyzes the transcript to structure it into summaries, timelines, and action items.
5. When you use the AI chat, the app uses prompt engineering to feed relevant meeting context to Gemini so it can accurately answer questions about past discussions.

---

## 🚧 Challenges & What I Learned

Building this taught me a lot about handling asynchronous API calls. Audio transcription takes time, so I had to design the UI to gracefully handle loading states while waiting for AssemblyAI and Gemini to finish processing. I also learned how to prompt AI effectively—tuning Gemini to consistently output clean timelines and action items instead of just a block of text took some careful engineering!

---

**Author**  
Riya Singh  
*B.Tech CSE*


