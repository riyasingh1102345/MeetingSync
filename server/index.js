import 'dotenv/config';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '.env') });

import express from 'express';
import cors from 'cors';
import { AssemblyAI } from 'assemblyai';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 3001;
const aai = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'MeetLens AI server is running!' });
});

// Main AI processing endpoint
app.post('/api/process', async (req, res) => {
  const { videoUrl } = req.body;

  if (!videoUrl) {
    return res.status(400).json({ error: 'videoUrl is required' });
  }

  console.log('🎙️  Starting transcription for:', videoUrl);

  try {
    // Step 1: Transcribe with AssemblyAI (with speaker diarization)
    const transcript = await aai.transcripts.transcribe({
      audio: videoUrl,
      speaker_labels: true,
    });

    if (transcript.status === 'error') {
      throw new Error(`AssemblyAI error: ${transcript.error}`);
    }

    console.log('✅ Transcription complete!');

    // Build structured transcript lines (Sentence-level breakdown)
    const transcriptLines = [];
    if (transcript.utterances && transcript.utterances.length > 0) {
      transcript.utterances.forEach((utterance) => {
        if (utterance.words && utterance.words.length > 0) {
          let currentSentence = [];
          let sentenceStartTime = utterance.words[0].start;
          
          utterance.words.forEach((word) => {
            currentSentence.push(word.text);
            // Check if word ends with punctuation to split sentence
            if (word.text.match(/[.!?]$/)) {
              const minutes = Math.floor(sentenceStartTime / 60000);
              const seconds = Math.floor((sentenceStartTime % 60000) / 1000);
              transcriptLines.push({
                time: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
                speaker: `Speaker ${utterance.speaker}`,
                text: currentSentence.join(' ')
              });
              currentSentence = [];
              sentenceStartTime = null;
            } else if (currentSentence.length === 1 && !sentenceStartTime) {
              sentenceStartTime = word.start;
            }
          });
          
          // Push any remaining words that didn't end in punctuation
          if (currentSentence.length > 0) {
            const minutes = Math.floor((sentenceStartTime || utterance.start) / 60000);
            const seconds = Math.floor(((sentenceStartTime || utterance.start) % 60000) / 1000);
            transcriptLines.push({
              time: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
              speaker: `Speaker ${utterance.speaker}`,
              text: currentSentence.join(' ')
            });
          }
        } else {
        transcriptLines.push({
          time: msToTimestamp(utterance.start),
          timeMs: utterance.start,
          speaker: `Speaker ${utterance.speaker}`,
          text: utterance.text,
        });
      }});
    } else {
      // Fallback when no speaker labels: split by sentence
      const sentences = transcript.text?.split(/(?<=[.!?])\s+/) || [];
      const totalDurationMs = (transcript.audio_duration || 0) * 1000;
      const intervalMs = totalDurationMs / (sentences.length || 1);
      sentences.forEach((s, i) => {
        if (s.trim()) {
          transcriptLines.push({
            time: msToTimestamp(i * intervalMs),
            timeMs: i * intervalMs,
            speaker: 'Speaker A',
            text: s.trim(),
          });
        }
      });
    }

    // ── Build a timestamped text block to send to Gemini ─────────
    const timestampedText = transcriptLines
      .map(l => `[${l.time}] ${l.speaker}: ${l.text}`)
      .join('\n');

    // ── Step 2: Ask Gemini to generate summary, action items, AND chapters ──
    console.log('🤖 Generating AI summary & chapters...');
    let aiData = { summary: 'Summary not available.', actionItems: [], chapters: [], host: 'Unknown', attendeeCount: 1, speakerNames: {} };

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
      const prompt = `
You are an expert AI meeting analyst. Analyze the following meeting transcript and return a JSON object.

RULES:
- "chapters" should group the conversation into logical sections (like YouTube chapters). Each chapter needs:
  - "time": the EXACT timestamp from the transcript where this topic starts (e.g. "00:12"), must match a real [MM:SS] marker in the transcript
  - "title": a short 3-5 word title for that section
  - "bullets": 2-4 bullet points summarizing the KEY things said in that section. Be concise, factual, and specific. Do NOT paraphrase vaguely.
- Number of chapters should scale with video length: ~2-3 chapters for <2 min videos, ~4-6 for 2-10 min, ~7-10 for longer.
- "summary": a 2-3 sentence overall meeting summary.
- "actionItems": 3-5 specific action items mentioned (tasks, follow-ups, decisions). If none, return [].
- "host": The name of the person who led the discussion or spoke most. If they introduced themselves by name, use their real name. Otherwise use their speaker label (e.g. "Speaker A").
- "attendeeCount": total number of unique speakers.
- "speakerNames": A mapping of speaker labels to real names. Look carefully in the transcript for any self-introductions like "Hi, I'm John", "This is Sarah", "My name is...", etc. Map the speaker label to the real name. Example: { "Speaker A": "Riya Singh", "Speaker B": "Speaker B" }. If a speaker never says their name, keep their label as-is.

Respond ONLY with valid JSON in this exact format:
{
  "summary": "...",
  "actionItems": ["...", "..."],
  "host": "Speaker A or their real name",
  "attendeeCount": 2,
  "speakerNames": { "Speaker A": "Real Name or Speaker A", "Speaker B": "Real Name or Speaker B" },
  "chapters": [
    { "time": "00:00", "title": "Opening & Introductions", "bullets": ["Point 1", "Point 2"] },
    { "time": "01:15", "title": "Main Discussion", "bullets": ["Point 1", "Point 2", "Point 3"] }
  ]
}

TRANSCRIPT:
${timestampedText}
`;
      const result = await model.generateContent(prompt);
      const rawText = result.response.text();
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiData = JSON.parse(jsonMatch[0]);
      }
      console.log('✅ AI analysis complete! Chapters:', aiData.chapters?.length);
    } catch (geminiErr) {
      console.warn('⚠️ Gemini failed:', geminiErr.message);
      aiData.summary = 'AI summary is temporarily unavailable. Your full transcript is ready below.';
    }

    // ── Calculate accurate unique speakers from AssemblyAI diarization ──
    const uniqueSpeakers = new Set(transcriptLines.map(l => l.speaker)).size;
    const actualAttendeeCount = uniqueSpeakers > 0 ? uniqueSpeakers : 1;

    // Return all data to the React app
    res.json({
      transcriptText: transcript.text,
      transcriptLines,
      chapters: aiData.chapters || [],
      summary: aiData.summary,
      actionItems: aiData.actionItems || [],
      host: aiData.host || 'Unknown',
      attendeeCount: actualAttendeeCount,
      speakerNames: aiData.speakerNames || {},
    });

  } catch (err) {
    console.error('❌ Processing error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Chatbot endpoint
app.post('/api/chat', async (req, res) => {
  const { query, context } = req.body;
  if (!query) return res.status(400).json({ error: 'Query is required' });

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
    const prompt = `
You are a helpful, personalized AI meeting assistant. Answer the user's question concisely based ONLY on the provided meeting context below. If the answer is not in the context, politely say you don't know based on the current meetings.

CONTEXT:
${context || 'No meeting context provided.'}

USER QUESTION:
${query}
    `;
    const result = await model.generateContent(prompt);
    res.json({ answer: result.response.text() });
  } catch (err) {
    console.error('❌ Chat error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 MeetingSync server running on http://localhost:${PORT}`);
});
