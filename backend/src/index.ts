import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';

import { parseDocument } from './services/documentParser.js';
import { testConnection } from './database/connection.js';
import * as journalRepo from './repositories/journalRepository.js';
import * as recommendationService from './services/recommendationService.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = './uploads';
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'));
    }
  }
});

// Routes

// Authentication
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  const validEmail = process.env.AUTH_EMAIL;
  const validPassword = process.env.AUTH_PASSWORD;

  if (!validEmail || !validPassword) {
    console.error('AUTH_EMAIL or AUTH_PASSWORD not configured');
    return res.status(500).json({ success: false, error: 'Authentication not configured' });
  }

  if (email === validEmail && password === validPassword) {
    return res.json({ success: true, message: 'Login successful' });
  }

  return res.status(401).json({ success: false, error: 'Invalid credentials' });
});

// Health check
app.get('/api/health', async (req, res) => {
  const dbConnected = await testConnection();
  res.json({
    status: dbConnected ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    database: dbConnected ? 'connected' : 'disconnected'
  });
});

// Get all journals with filters
app.get('/api/journals', async (req, res) => {
  try {
    const filters: journalRepo.JournalFilters = {
      sjrQuartile: req.query.quartile ? (req.query.quartile as string).split(',') : undefined,
      areas: req.query.areas ? (req.query.areas as string).split(',') : undefined,
      openAccess: req.query.openAccess ? req.query.openAccess === 'true' : undefined,
      minSjr: req.query.minSjr ? parseFloat(req.query.minSjr as string) : undefined,
      maxSjr: req.query.maxSjr ? parseFloat(req.query.maxSjr as string) : undefined,
      minHIndex: req.query.minHIndex ? parseInt(req.query.minHIndex as string) : undefined,
      search: req.query.search as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };

    const [journals, total] = await Promise.all([
      journalRepo.getAllJournals(filters),
      journalRepo.getJournalCount(filters)
    ]);

    res.json({
      success: true,
      data: journals,
      pagination: {
        total,
        limit: filters.limit,
        offset: filters.offset,
        hasMore: (filters.offset || 0) + journals.length < total
      }
    });
  } catch (error) {
    console.error('Error fetching journals:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch journals' });
  }
});

// Get single journal
app.get('/api/journals/:id', async (req, res) => {
  try {
    const journal = await journalRepo.getJournalById(req.params.id);
    if (!journal) {
      return res.status(404).json({ success: false, error: 'Journal not found' });
    }
    res.json({ success: true, data: journal });
  } catch (error) {
    console.error('Error fetching journal:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch journal' });
  }
});

// Search journals by scope
app.get('/api/journals/search/scope', async (req, res) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ success: false, error: 'Search query is required' });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const journals = await journalRepo.searchJournalsByScope(query, limit);

    res.json({ success: true, data: journals });
  } catch (error) {
    console.error('Error searching journals:', error);
    res.status(500).json({ success: false, error: 'Failed to search journals' });
  }
});

// Get subject areas
app.get('/api/areas', async (req, res) => {
  try {
    const areas = await journalRepo.getSubjectAreas();
    res.json({ success: true, data: areas });
  } catch (error) {
    console.error('Error fetching areas:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch areas' });
  }
});

// Get categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await journalRepo.getCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
});

// Get publishers
app.get('/api/publishers', async (req, res) => {
  try {
    const publishers = await journalRepo.getPublishers();
    res.json({ success: true, data: publishers });
  } catch (error) {
    console.error('Error fetching publishers:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch publishers' });
  }
});

// Get journal statistics
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await journalRepo.getJournalStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

// Upload and analyze manuscript
app.post('/api/analyze', upload.single('manuscript'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const mimeType = req.file.mimetype;

    // Parse filters from form data if provided
    let filters;
    if (req.body.filters) {
      try {
        filters = JSON.parse(req.body.filters);
        console.log('Applied filters:', JSON.stringify(filters));
      } catch (e) {
        console.warn('Failed to parse filters:', e);
      }
    }

    // Step 1: Parse document
    console.log('Parsing document...');
    const { title, abstract } = await parseDocument(filePath, mimeType);

    // Step 2: Generate recommendations
    console.log('Generating recommendations...');
    const result = await recommendationService.generateRecommendations({
      title,
      abstract,
      fileName: req.file.originalname,
      fileType: path.extname(req.file.originalname).slice(1),
      sessionId: req.headers['x-session-id'] as string,
      filters,
    });

    // Clean up uploaded file
    await fs.unlink(filePath).catch(() => { });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze manuscript'
    });
  }
});

// Analyze with provided title and abstract (no file upload)
app.post('/api/analyze/text', async (req, res) => {
  try {
    const { title, abstract, filters } = req.body;

    if (!title || !abstract) {
      return res.status(400).json({
        success: false,
        error: 'Title and abstract are required'
      });
    }

    console.log('Generating recommendations from text...');
    if (filters) {
      console.log('Applied filters:', JSON.stringify(filters));
    }

    const result = await recommendationService.generateRecommendations({
      title,
      abstract,
      sessionId: req.headers['x-session-id'] as string,
      filters,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze manuscript'
    });
  }
});

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: error.message || 'Internal server error'
  });
});

// Start server
async function startServer() {
  // Test database connection
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.warn('Database not connected. Some features may be unavailable.');
  }

  app.listen(PORT, () => {
    console.log(`Journal Recommender API running on http://localhost:${PORT}`);
    console.log(`Database: ${dbConnected ? 'Connected' : 'Not connected'}`);
    console.log(`OpenAI: ${process.env.OPENAI_API_KEY ? 'Enabled' : 'Disabled'}`);
  });
}

startServer();
