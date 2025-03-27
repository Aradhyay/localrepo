const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send({
    activeStatus: true,
    error:false,
    message: "Server is running",
  });
});

// Set up Multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Hugging Face API Configuration
const HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/iarfmoose/t5-base-question-generator";
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;  

// Upload and Process PDF
app.post("/upload", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        // Extract text from PDF
        const pdfData = await pdfParse(req.file.buffer);
        const extractedText = pdfData.text;

        // Send the extracted text to Hugging Face API
        const response = await axios.post(HUGGINGFACE_API_URL, 
            { inputs: extractedText }, 
            { headers: { Authorization: `Bearer ${HUGGINGFACE_API_KEY}` } }
        );

        // Format the response into MCQs
        const mcqs = response.data.map(q => ({
            question: q.generated_text,
            options: ["A) Option1", "B) Option2", "C) Option3", "D) Option4"]
        }));

        res.json({ mcqs });

    } catch (error) {
        console.error("Error processing file:", error);
        res.status(500).json({ error: "Error processing file" });
    }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
