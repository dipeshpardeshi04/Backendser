const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const puppeteer = require('puppeteer');
// const {executablePath} = require('puppeteer');
const fs = require('fs');
require('dotenv').config();
const executablePath = path.join('C:', 'Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe');
const app = express();
const PORT = 4000;
let isFileReady = false; // Flag to indicate when the PDF is ready

// app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(cors());
// MongoDB connection


// Now you can access the variables in process.env
console.log(process.env.DATABASE_URL); // Output: your_api_key_here
console.log(process.env.PORT); // Output: localhost
const DBURL = process.env.DATABASE_URL;
const port = process.env.PORT || 4000;

mongoose.connect(DBURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((error) => {
  console.error('Error connecting to MongoDB:', error);
});

// Mongoose Schema and Model
const userSchema = new mongoose.Schema({
    url: {
        type: String,
        // required: true
    }
});

const URLModel = mongoose.model('URL', userSchema);

// Route to submit URL and start PDF generation
let parts;
app.post('/urll', async (req, res) => {
    try {
        let { url } = req.body;
        parts = url;
        const newUser = new URLModel({ url });
      console.log("uuuuuuurrrrrrrlllllllllll:::");
      console.log(parts);
        await newUser.save();

        // Reset the file ready flag
        isFileReady = false;

        // Generate PDF asynchronously
        (async () => {
            const browser = await puppeteer.launch({ executablePath: executablePath,
                                                      headless: true,
                                                      args: ['--no-sandbox', '--disable-setuid-sandbox']
                                                    // args: [
                                                    //   "--disable-setuid-sandbox",
                                                    //   "--no-sandbox",
                                                    //   "--single-process",
                                                    //   "--no-zygote",
                                                    // ],
                                                    // executablePath:
                                                    //         process.env.NODE_ENV === "production"
                                                    //           ? process.env.PUPPETEER_EXECUTABLE_PATH
                                                    //           : puppeteer.executablePath(),
                            });
            const page = await browser.newPage();
            await page.goto(url, { waitUntil: 'networkidle2' });

            try {
                await page.waitForSelector('.relative.max-w-\\[70\\%\\]', { timeout: 60000 });

                const questions = await page.evaluate(() => {
                    const textElements = document.querySelectorAll('div.relative.max-w-\\[70\\%\\]');
                    return Array.from(textElements).map(element => element.querySelector('div').innerText);
                });

                const answers = await page.evaluate(() => {
                    const answerElements = document.querySelectorAll('.markdown.prose.w-full.break-words.dark\\:prose-invert.dark');
                    return Array.from(answerElements).map(element => element.innerHTML);
                });

                const htmlContent = `
                    <html>
        <head>
          <title>Scraped Data</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              background-color: #f8f9fa;
              color: #212529;
              margin: 30px 35px;
              line-height: 1.6;
            }
            h1 {
              font-size: 24px;
              color: #343a40;
              margin-bottom: 20px;
            }
            p {
              font-size: 16px;
              margin: 0 0 10px;
              padding: 10px;
              background-color: #ffffff;
              border-radius: 5px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            pre {
              background-color: #f1f3f5;
              border-left: 3px solid #007bff;
              padding: 10px;
              overflow-x: auto;
              font-family: 'Courier New', Courier, monospace;
              font-size: 14px;
            }
            code {
              background-color: #e9ecef;
              padding: 2px 4px;
              border-radius: 3px;
              font-family: 'Courier New', Courier, monospace;
            }
            button {
              display: none;
            }
          </style>
        </head>
        <body>
          ${questions.map((question, index) => `
            <h2>Question ${index + 1}:</h2>
            <p>${question}</p>
            <h2>Answer ${index + 1}:</h2>
            <div>${answers[index] || 'No answer found'}</div>
          `).join('')}
          <h6>This data is Get from : ${url}</h6>

        </body>
      </html>
    `;

                await page.setContent(htmlContent);
                await page.pdf({
                    path: `${parts.split("/")[4]}.pdf`, // Path to save the PDF
                    format: 'A4',
                    printBackground: true,
                });

                console.log('PDF created successfully.');
                isFileReady = true; // Set flag to true when the file is ready
            } catch (error) {
                console.error('Error:', error.message);
            }

            await browser.close();
        })();

        res.status(200).json({ message: 'URL submitted, processing PDF.' });
    } catch (error) {
        res.status(400).json({ message: error.message });
        console.log(error);
    }
});

// Route to check if the PDF is ready
app.get('/status', (req, res) => {

  console.log(" Status seen !!!!!!!!!!!!!!!");
    res.json({ isFileReady });
});

// Route to download the PDF
app.get('/pdfs', (req, res) => {
    if (isFileReady) {
        res.download(`./${parts.split("/")[4]}.pdf`);
    } else {
        res.status(404).json({ message: 'PDF not ready yet' });
    }
});
app.get('/', (req, res) => {
  res.send('Hello World!');
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
