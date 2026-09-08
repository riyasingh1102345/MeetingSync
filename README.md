# MeetLens AI 🎥✨

**Live Demo:** [https://meetlens-ai.vercel.app](https://meetlens-ai.vercel.app)

MeetLens AI is an intelligent, all-in-one meeting platform that combines high-quality live video conferencing with automated AI analysis. It goes beyond simple transcription by generating minute-by-minute timelines, extracting precise speaker names, and providing a ChatGPT-like AI assistant to query your meeting history.

## 🚀 Key Features

* **In-Built Live Meetings:** Seamless WebRTC-powered (Jitsi) video conferencing with native screen sharing, camera/mic toggles, and real-time recording.
* **AI-Powered Diarization:** Accurately detects and labels distinct speakers, even mapping them to real participant names using conversational context.
* **Minute-by-Minute Timeline:** Automatically breaks down your 1-hour meeting into bite-sized, chronological segments with summaries and key bullet points.
* **Interactive AI Chatbot:** Ask questions about past meetings like *"What did John say about the Q3 marketing budget?"* and get context-aware answers.
* **Smart Summaries & Action Items:** Instantly extracts the core summary, decisions made, and pending action items from any meeting.
* **Video Upload Processing:** Missed recording live? Upload any standard video/audio file (MP4, WebM, MP3) to get the same powerful AI analysis.

## 🛠️ Technical Stack

* **Frontend:** React 19, Vite, React Router, Tailwind CSS (via inline styles & global CSS), Lucide Icons
* **Backend:** Node.js, Express.js, REST APIs
* **Database & Auth:** Firebase Firestore (NoSQL), Firebase Authentication (Google OAuth & Email/Password)
* **AI Pipelines:** 
  * **Google Gemini AI:** Used for complex contextual analysis, speaker name extraction, minute-by-minute structuring, and the RAG (Retrieval-Augmented Generation) chatbot.
  * **AssemblyAI:** Used for high-accuracy asynchronous speech-to-text and base speaker diarization.
* **Media Storage:** Cloudinary (handles robust video file uploads)
* **Deployment:** Vercel (Frontend) & Render (Backend)

## 👨‍💻 Developer Notes

This project was built with a hybrid serverless/Express architecture to bypass client-side AI processing limits, utilizing a robust polling mechanism for long-running transcription tasks.

*(Recruiters: Feel free to test the application using the live demo link above!)*
