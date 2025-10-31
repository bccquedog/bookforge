# BookForge - Professional Book Formatting Tool

Transform your manuscript into professional print-ready books with BookForge. Generate PDF, EPUB, and DOCX formats with ease using our interactive wizard and powerful formatting engine.

## 🚀 Features

- **Interactive Wizard**: Guided setup process that asks the right questions for professional results
- **Multiple Formats**: Generate PDF, EPUB, and DOCX outputs from your manuscript
- **Print-Ready**: Professional layout with proper margins, fonts, and page rules
- **Industry Standards**: KDP and Ingram presets with proper trim sizes and margins
- **Professional Quality**: Running heads, widows/orphans control, and proper typography
- **Fast Processing**: Quick conversion from manuscript to publication-ready formats

## 🌐 Web Application

The React web application provides a modern, user-friendly interface for book formatting:

- **Landing Page**: Showcase of features and benefits
- **Interactive Wizard**: Step-by-step book configuration
- **Dashboard**: Manage your book projects and track progress
- **Settings**: Customize your preferences and API configuration

## 🚀 Deployment

BookForge can be deployed with:
- **Frontend**: Vercel (React app)
- **Backend**: Railway, Google Cloud Run, or Heroku (Python API)

See [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md) for complete deployment instructions.

## 🛠️ Installation

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- API Keys: Google Gemini, OpenAI (for covers), and Firebase
- See `api/ENV_SETUP.md` for detailed API setup instructions

### Frontend (React Web App)

```bash
# Install dependencies
npm install

# Copy environment variables
cp env.example .env.local

# Edit .env.local and configure:
# - VITE_API_BASE (backend URL)
# - VITE_USE_MOCK_API (set to false for production)

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Backend (Python API)

```bash
# Navigate to API directory
cd api

# Install Python dependencies
pip install -r requirements.txt

# Set up environment variables (see api/ENV_SETUP.md)
# Required: GEMINI_API_KEY, OPENAI_API_KEY, FIREBASE_SERVICE_ACCOUNT

# Start the API server
python server.py
```

## 📖 Usage

### Web Application

1. **Start the Application**: Run `npm run dev` to start the React development server
2. **Access the App**: Open http://localhost:3000 in your browser
3. **Create a Project**: Use the Book Wizard to configure your book
4. **Upload Manuscript**: Upload your .docx, .md, or .txt file
5. **Generate Book**: Click "Generate Book" to create your formatted outputs

### CLI (Original Python Tool)

```bash
# Interactive wizard
python api/bookforge.py wizard path/to/manuscript.docx

# Non-interactive with config
python api/bookforge.py build --config bookforge.yml --manuscript manuscript.docx

# Calculate cover dimensions
python api/bookforge.py covercalc --trim 6x9 --pages 300 --paper cream_55lb
```

## 🔧 Configuration

### Supported File Formats

- **Input**: 
  - Microsoft Word: `.docx`, `.doc`
  - OpenDocument: `.odt`
  - Rich Text Format: `.rtf`
  - Markdown: `.md`
  - Plain Text: `.txt`, `.text`
  - HTML: `.html`, `.htm`
- **Output**: PDF, EPUB, DOCX

### Trim Sizes

- 5×8 inches (Trade)
- 5.5×8.5 inches (Trade)
- 6×9 inches (Trade) - Default
- 8.5×11 inches (Workbook)

### Paper Stocks

- Cream 55lb (444 pages per inch)
- White 50lb (512 pages per inch)

## 🌍 Deployment

### Vercel (Frontend)

The application is configured for easy deployment on Vercel:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel

# Deploy to production
vercel --prod
```

### Backend Deployment

The Python API can be deployed to any platform that supports Python:

- **Heroku**: Use the provided requirements.txt
- **AWS Lambda**: Package with dependencies
- **Docker**: Create a Dockerfile for containerized deployment

## 📁 Project Structure

```
bookforge/
├── src/                    # React frontend source
│   ├── components/         # Reusable UI components
│   ├── pages/             # Application pages
│   ├── lib/               # Utility functions
│   └── types/             # TypeScript type definitions
├── api/                   # Python backend
│   ├── server.py          # Flask API server
│   ├── bookforge.py       # Core book formatting logic
│   └── requirements.txt   # Python dependencies
├── public/                # Static assets
└── docs/                  # Documentation
```

## 🔌 API Endpoints

- `GET /api/health` - Health check
- `POST /api/projects` - Create new project
- `GET /api/projects` - List all projects
- `GET /api/projects/{id}` - Get project details
- `POST /api/projects/{id}/upload` - Upload manuscript
- `POST /api/projects/{id}/build` - Build book
- `GET /api/projects/{id}/download/{format}` - Download book
- `DELETE /api/projects/{id}` - Delete project

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue on GitHub
- Check the documentation
- Contact the development team

---

**BookForge** - Transform your manuscript into professional books with ease.


