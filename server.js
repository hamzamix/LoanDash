
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import cors from 'cors';

const app = express();
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataFilePath = process.env.DATA_FILE_PATH || path.join('/data', 'db.json');

const getDefaultData = () => ({
    'loandash-dark-mode': true,
    'loandash-debts': [],
    'loandash-loans': [],
    'loandash-archived-debts': [],
    'loandash-archived-loans': [],
    'loandash-auto-archive': 'never',
});

// This function safely initializes or re-initializes the data file.
const initializeDataFile = async () => {
    try {
        await fs.writeFile(dataFilePath, JSON.stringify(getDefaultData(), null, 2), 'utf-8');
        console.log('Data file initialized/reset successfully at', dataFilePath);
        return getDefaultData();
    } catch (writeError) {
        console.error("FATAL: Could not write initial data file.", writeError);
        throw writeError; // Propagate error if we can't even write the initial file
    }
};

// This function safely reads the data file, and resets it if it's corrupt or missing.
const getSafeData = async () => {
    try {
        const fileContent = await fs.readFile(dataFilePath, 'utf-8');
        if (!fileContent) { // Handles empty file case
            console.warn('Data file is empty. Re-initializing.');
            return await initializeDataFile();
        }
        return JSON.parse(fileContent); // Tries to parse
    } catch (error) {
        // Catches file not found, or JSON.parse errors
        console.error('Could not read or parse data file, it might be corrupt. Re-initializing.', error);
        return await initializeDataFile();
    }
};

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

// API endpoint to get all data
app.get('/api/data', async (req, res) => {
    try {
        const data = await getSafeData();
        res.json(data);
    } catch (error) {
        console.error('Error safely reading data file:', error);
        res.status(500).json({ error: 'Could not read data file.' });
    }
});

// API endpoint to save all data
app.post('/api/data', async (req, res) => {
    try {
        await fs.writeFile(dataFilePath, JSON.stringify(req.body, null, 2), 'utf-8');
        res.status(200).json({ message: 'Data saved successfully.' });
    } catch (error) {
        console.error('Error writing to data file:', error);
        res.status(500).json({ error: 'Could not save data.' });
    }
});

// All other GET requests are sent to the React app's index.html file
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Initialize and start the server
getSafeData().then(() => {
    app.listen(port, () => {
        console.log(`LoanDash server listening on port ${port}`);
        console.log(`Data is being stored at ${dataFilePath}`);
    });
}).catch(err => {
    console.error("Failed to initialize server on first run:", err);
    process.exit(1);
});
