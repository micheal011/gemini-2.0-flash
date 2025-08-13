// const express = require('express');
// const dotenv = require('dotenv');
// const multer = require('multer');
// const fs = require('fs');
// const path = require('path');
// const {GoogleGenerativeAI} = require('@google/generative-ai');

// dotenv.config();
// const app = express();
// app.use(express.json());

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// const model = genAI.getGenerativeModel({model: 'models/gemini-2.0-flash'});

// const upload = multer({dest: 'uploads/'});

// const PORT = 3000;

// app.listen(PORT, () => {
//     console.log('Gemini API server is running at http://localhost:${PORT}');
// });

// app.post('/generate-text', async (req, res) => {
//     const {prompt} = req.body;

//     try {
//         const result = await model.generateContent(prompt);
//         const response = await result.response;
//         res.json({output: response.text});
//     } catch (error) {
//         res.status(500).json({error: error.message});
//     }
// });

import express from 'express';
import dotenv from 'dotenv';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

dotenv.config();
const app = express();
app.use(express.json());

const genAI = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});
const model = async (contents) => await genAI.models.generateContent({
    model: 'models/gemini-2.0-flash',
    contents
});

const upload = multer({ dest: 'uploads/' });

app.post('/generate-text', async (req, res) => {
    const { prompt } = req.body;

    try {
        const result = await model(prompt);
        // const response = await result.response;
        res.json({ output: result.text() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        fs.unlinkSync(filePath);
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Gemini API server is running at http://localhost:${PORT}`);
});