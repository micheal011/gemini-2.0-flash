import express from 'express';
import dotenv from 'dotenv';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

dotenv.config();
const app = express();
app.use(express.json());

const genAI = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  });

// Untuk Generate Text
app.post('/generate-text', async (req, res) => {
    try {
        const prompt = req.body?.prompt || 'Hello from Gemini 2.0!';
        const result = await genAI.models.generateContent({
            model: 'models/gemini-2.0-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        });

        const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        res.json({ output: text });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Untuk vision-to-text (kirim gambar direspon dengan text)
// masih ada error, sedang diperbaiki
app.post('/generate-from-image', upload.single('image'), async (req, res) => {
    // const image = imageToGenerativePart(req.file.path);
    console.log('content-type:', req.headers['content-type']);
    console.log('req.file:', req.file);
    console.log('req.body:', req.body);
    console.log('size:', req.file?.size, 'mime:', req.file?.mimetype);

    try {
        if (!req.file) {
            return res.status(400).json({error: 'File image wajib di-upload'});
        }

        const prompt = (req.body?.prompt || 'Describe the image').toString();
        // const data = await fs.readFile(req.file.path, {encoding: 'base64'});
        const base64 = req.file.buffer.toString('base64');
        const mime = req.file.mimetype || 'image/jpeg';
        
        const result = await genAI.models.generateContent({
            model: 'models/gemini-2.0-flash',
            contents: [{ role: 'user', parts: [
                {text: prompt},
                {inline_data: {mime_type: mime, data: base64}}
            ]}]
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    // console.log(`Gemini API server is running at http://localhost:${PORT}`);
    console.log(`Gemini API server is running at`, PORT);
});