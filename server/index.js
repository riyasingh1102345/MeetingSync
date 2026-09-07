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

// Helper: try multiple Gemini models with retry to handle 503 overload errors
async function callGemini(prompt, models = ['gemini-3.7-flash', 'gemini-3.5-flash', 'gemini-3.6-flash']) {
  for (const modelName of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`🤖 Trying ${modelName} (attempt ${attempt})...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        console.log(`✅ ${modelName} responded successfully`);
        return result.response.text();
      } catch (err) {
        console.warn(`⚠️ ${modelName} attempt ${attempt} failed: ${err.message}`);
        if (attempt < 2) await new Promise(r => setTimeout(r, 2000));
      }
    }
  }
  throw new Error('All Gemini models are currently unavailable. Please try again.');
}

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'MeetLens AI server is running!' });
});

// Main AI processing endpoint
app.post('/api/process', async (req, res) => {
  const { videoUrl, participants } = req.body;

  if (!videoUrl) {
    return res.status(400).json({ error: 'videoUrl is required' });
  }

  console.log('🎙️  Starting transcription for:', videoUrl, 'with participants hint:', participants);

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

    // ── Step 2: Ask Gemini to generate summary, action items, chapters, minute-by-minute & real speaker names ──
    console.log('🤖 Generating AI summary, minute-by-minute timeline & speaker diarization...');
    let aiData = { 
      summary: 'Summary not available.', 
      actionItems: [], 
      chapters: [], 
      minuteByMinute: [], 
      host: 'Unknown', 
      attendeeCount: 1, 
      speakerNames: {} 
    };

    const participantsHint = participants 
      ? `PARTICIPANTS HINT (Expected speakers in this meeting): ${Array.isArray(participants) ? participants.join(', ') : participants}`
      : 'PARTICIPANTS HINT: Not explicitly provided. Analyze transcript cues, greetings, self-introductions, and names addressed to determine who each speaker is.';

    try {
      const prompt = `
You are an expert AI meeting intelligence and audio analyst. Analyze the following meeting transcript and return a detailed JSON object.

${participantsHint}

CRITICAL RULES:
1. "speakerNames": Identify the REAL NAMES of every speaker label (Speaker A, Speaker B, Speaker C, etc.).
   - Look carefully for self-introductions ("Hi, I'm Riya", "My name is Grover"), greetings ("Good morning Kritika", "Thanks Riya"), and conversational assignments ("Grover, can you handle this?").
   - If a PARTICIPANTS HINT is given, match the speaker labels to those names based on context.
   - Do NOT leave names as generic "Speaker A" if any name or clue exists. Only keep "Speaker A" if there is genuinely no name or clue anywhere in the transcript.
   - Format example: { "Speaker A": "Riya Singh", "Speaker B": "Grover" }

2. "minuteByMinute": A detailed chronological breakdown of the meeting into 1-minute or 2-minute chronological windows (e.g. "00:00 - 01:00", "01:00 - 02:00", etc.).
   For EACH window provide:
   - "time": start timestamp (e.g. "00:00")
   - "timeRange": e.g. "00:00 - 01:00"
   - "title": concise 3-6 word summary of discussion in that window
   - "speakers": array of real names who spoke in this window (e.g. ["Riya Singh", "Grover"])
   - "summary": 1-2 sentence description of what happened in that specific minute
   - "keyPoints": 1-3 bullet points highlighting what was said or decided in that window

3. "chapters": High-level chapter milestones (like YouTube chapters):
   - "time": timestamp (e.g. "00:00")
   - "title": short 3-5 word title
   - "bullets": 2-4 key takeaway bullet points

4. "summary": A clear 2-4 sentence executive overview of the meeting.
5. "actionItems": Specific tasks, assignments, and follow-ups with person assigned if mentioned (e.g. "Grover to test Stripe API by Friday").
6. "host": The real name of the primary meeting host/facilitator.
7. "attendeeCount": Total number of unique human attendees.

Respond ONLY with valid JSON in this exact structure:
{
  "summary": "...",
  "actionItems": ["..."],
  "host": "Real Name",
  "attendeeCount": 2,
  "speakerNames": { "Speaker A": "Real Name", "Speaker B": "Real Name" },
  "minuteByMinute": [
    {
      "time": "00:00",
      "timeRange": "00:00 - 01:00",
      "title": "Welcome & Project Overview",
      "speakers": ["Riya Singh", "Grover"],
      "summary": "Riya welcomed Grover and set the agenda regarding the upcoming e-commerce release.",
      "keyPoints": ["Reviewed project goals", "Agreed on launch priorities"]
    }
  ],
  "chapters": [
    { "time": "00:00", "title": "Opening & Agenda", "bullets": ["Point 1", "Point 2"] }
  ]
}

TRANSCRIPT:
${timestampedText}
`;
      const rawText = await callGemini(prompt);
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiData = JSON.parse(jsonMatch[0]);
      }
      console.log('✅ AI analysis complete! Minute-by-minute entries:', aiData.minuteByMinute?.length, 'Chapters:', aiData.chapters?.length);
    } catch (geminiErr) {
      console.warn('⚠️ Gemini failed:', geminiErr.message);
      aiData.summary = 'AI summary is temporarily unavailable. Your full transcript is ready below.';
    }

    // ── Rewrite transcript lines using the resolved real speaker names ──
    const resolvedSpeakerNames = aiData.speakerNames || {};
    const updatedTranscriptLines = transcriptLines.map(line => {
      const realName = resolvedSpeakerNames[line.speaker] || line.speaker;
      return {
        ...line,
        speaker: realName
      };
    });

    // ── Calculate accurate unique speakers ──
    const uniqueSpeakers = new Set(updatedTranscriptLines.map(l => l.speaker)).size;
    const actualAttendeeCount = uniqueSpeakers > 0 ? uniqueSpeakers : 1;

    // Return all enhanced data to the React app
    res.json({
      transcriptText: transcript.text,
      transcriptLines: updatedTranscriptLines,
      chapters: aiData.chapters || [],
      minuteByMinute: aiData.minuteByMinute || [],
      summary: aiData.summary,
      actionItems: aiData.actionItems || [],
      host: aiData.host || 'Unknown',
      attendeeCount: actualAttendeeCount,
      speakerNames: resolvedSpeakerNames,
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
    const prompt = `
You are a helpful, personalized AI meeting assistant. Answer the user's question concisely based ONLY on the provided meeting context below. If the answer is not in the context, politely say you don't know based on the current meetings.

CONTEXT:
${context || 'No meeting context provided.'}

USER QUESTION:
${query}
    `;
    const answer = await callGemini(prompt, ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.7-flash']);
    res.json({ answer });
  } catch (err) {
    console.error('❌ Chat error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 MeetingSync server running on http://localhost:${PORT}`);
});
