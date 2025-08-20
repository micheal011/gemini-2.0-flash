import express from 'express';
import dotenv from 'dotenv';
import multer from 'multer';
import * as fs from "node:fs";
import path from 'path';
import { GoogleGenAI } from '@google/genai';

dotenv.config();
const app = express();
app.use(express.json());

const genAI = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});
const GEMINI_MODEL = 'models/gemini-2.0-flash';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  });

function extractText(resp) {
    try {
        const text = resp?.response?.candidates?.[0]?.content?.parts?.[0]?.text ?? resp?.candidates?.[0]?.content?.parts?.[0]?.text ?? resp?.response?.candidates?.[0]?.content?.text;

        return text ?? JSON.stringify(resp, null, 2);
    } catch (error) {
        console.error("Error extracting text:", error);
        return JSON.stringify(resp, null, 2);
    }
}

// Untuk Generate Text
app.post('/generate-text', async (req, res) => {
    try {
        const prompt = req.body?.prompt || 'Hello from Gemini 2.0!';
        const result = await genAI.models.generateContent({
            model: GEMINI_MODEL,
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        });

        const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        res.json({ output: text });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Untuk vision-to-text (kirim gambar direspon dengan text)
app.post('/generate-from-image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({error: 'File image wajib di-upload'});
        }

        const prompt = (req.body?.prompt || 'Describe the image').toString();
        const base64 = req.file.buffer.toString('base64');
        const mime = req.file.mimetype || 'image/jpeg';
        
        const result = await genAI.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
                {
                    role: 'user',
                    parts: [
                        {
                            text: prompt
                        },
                        {
                            inlineData: {
                                mimeType: mime,
                                data: base64
                            }
                        }
            ]
        }
        ]
        });

        const text = result?.candidates?.[0]?.content?.parts?.map(p => p.text)?.join('') || '';

        res.json({output: text});
    } catch (error) {
        res.status(500).json({error: error.message});
    } finally {
        if (req.file?.path) {
            try {
               fs.unlinkSync(req.file.path);
            } catch (error) {}
        }
    }
});

// Untuk generate dari dokumen
app.post('/generate-from-document', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'File dokumen wajib di-upload (PDF/DOCX/TXT).' });
        }
        
        // const { prompt } = req.body;
        const prompt = (req.body?.prompt || 'Ringkas dokumen berikut:').toString();
        const docBase64 = req.file.buffer.toString('base64');
        const mime = req.file.mimetype || 'application/pdf';
        const result = await genAI.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
                {
                    role: 'user',
                    parts: [
                        {
                            text: prompt,
                        },
                        {
                            inlineData: {
                                mimeType: mime,
                                data: docBase64
                            }
                        }
                    ],
                }
            ]
        });

        // const text = result?.candidates?.[0]?.content?.parts?.map(p => p.text)?.join('') || '';
        // res.json({output: text});
        res.json({ result: extractText(result)});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Untuk generate dari audio
app.post('/generate-from-audio', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'File audio wajib di-upload.' });
        }
        const prompt = (req.body?.prompt || "Transkrip audio berikut:").toString();
        const audioBase64 = req.file.buffer.toString('base64');
        const mime = req.file.mimetype || 'audio/wav';
        const result = await genAI.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
                {
                    role: 'user',
                    parts: [
                        {
                            text: prompt,
                        },
                        {
                            inlineData: {
                                mimeType: mime,
                                data: audioBase64
                            }
                        }
                    ]
                }
            ]
        });
        res.json({ result: extractText(result) });
    } catch (error) {
        res.status(500).json({error: error.message});
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    // console.log(`Gemini API server is running at http://localhost:${PORT}`);
    console.log(`Gemini API server is running at`, PORT);
});