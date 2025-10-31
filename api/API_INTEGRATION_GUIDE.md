# API Integration Guide - BookForge

This guide explains how to use the newly integrated Gemini and Firebase APIs.

## 🔐 **Environment Setup**

Make sure your `.env.local` (or `.env`) file has these variables:

```bash
# Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Storage
FIREBASE_SERVICE_ACCOUNT=/path/to/service-account.json
# OR
FIREBASE_CONFIG_JSON='{"type":"service_account",...}'
FIREBASE_STORAGE_BUCKET=your-bucket-name.appspot.com

# OpenAI (for covers)
OPENAI_API_KEY=your_openai_key_here
```

## 🚀 **Features Enabled**

### 1. **Gemini AI Manuscript Analysis** ✅

**Endpoint**: `POST /api/projects/<project_id>/analyze`

**What it does**:
- Analyzes manuscript content using Google Gemini AI
- Provides comprehensive writing feedback
- Generates statistics and recommendations
- Classifies genre and reading level

**Response includes**:
- `overallScore`: Writing quality score (0-100)
- `strengths`: Array of positive observations
- `improvementAreas`: Constructive feedback
- `genreGuess`: Detected genre
- `readingLevel`: Target audience
- `pacing`: Pacing analysis
- `structure`: Structure assessment
- `recommendations`: Specific suggestions
- `statistics`: Technical metrics

**Example Request**:
```bash
curl -X POST http://localhost:8000/api/projects/project_123/analyze
```

**Example Response**:
```json
{
  "message": "Analysis completed successfully",
  "analysis": {
    "overallScore": 85,
    "strengths": ["Good dialogue", "Strong character development"],
    "improvementAreas": ["Could use more description"],
    "genreGuess": "Mystery/Thriller",
    "readingLevel": "Adult",
    "pacing": "Fast-paced",
    "structure": "Well-structured with 12 chapters",
    "recommendations": [
      {
        "title": "Add More Description",
        "description": "Consider adding more sensory details",
        "type": "suggestion"
      }
    ],
    "statistics": {
      "avgSentenceLength": 15.3,
      "avgParagraphLength": 85,
      "dialoguePercentage": 25.5,
      "actionPercentage": 3.2
    }
  }
}
```

### 2. **Firebase Storage Integration** ✅

**What it does**:
- Uploads manuscripts to Firebase Storage
- Makes files publicly accessible
- Stores both locally and in cloud
- Returns public URLs for files

**Automatic features**:
- Files uploaded to `/manuscripts/<project_id>/<filename>`
- Public URLs generated automatically
- Local backup copies maintained
- Content extracted automatically

**Example Response from Upload**:
```json
{
  "message": "File uploaded successfully",
  "filename": "my-book.docx",
  "size": 524288,
  "url": "https://storage.googleapis.com/your-bucket/manuscripts/project_123/my-book.docx",
  "content_length": 15234
}
```

### 3. **Real Document Processing** ✅

**Supported Formats**:
- `.txt` - Plain text
- `.md` - Markdown
- `.html`, `.htm` - HTML
- `.docx` - Microsoft Word
- `.odt` - OpenDocument Text
- `.rtf` - Rich Text Format

**Features**:
- Real text extraction (not simulated)
- Content stored for preview and analysis
- Proper handling of various encodings
- Fallback methods for reliability

## 📋 **Testing the Integration**

### 1. Test Gemini AI

```python
# In Python
import requests

response = requests.post(
    'http://localhost:8000/api/projects/test_123/analyze',
    json={}
)
print(response.json())
```

### 2. Test Firebase Upload

```bash
# Upload a file
curl -X POST \
  http://localhost:8000/api/projects/test_123/upload \
  -F "file=@manuscript.txt"
```

### 3. Test Complete Flow

1. Create project → `POST /api/projects`
2. Upload manuscript → `POST /api/projects/<id>/upload`
3. Analyze with Gemini → `POST /api/projects/<id>/analyze`
4. Build book → `POST /api/projects/<id>/build`
5. Download → `GET /api/projects/<id>/download/pdf`

## 🔍 **Checking API Status**

### Health Check Endpoint

```bash
curl http://localhost:8000/api/health
```

Response shows which APIs are configured:
```json
{
  "status": "healthy",
  "service": "BookForge API",
  "version": "1.0.0",
  "features": {
    "gemini": true,
    "firebase": true,
    "openai": true
  }
}
```

## 🐛 **Troubleshooting**

### Gemini Not Working

**Symptoms**: Analysis endpoint returns error 503

**Solutions**:
1. Check `GEMINI_API_KEY` is set in environment
2. Verify API key is valid at [Google AI Studio](https://makersuite.google.com/)
3. Check logs: `logger.info("Gemini AI configured successfully")`

### Firebase Not Uploading

**Symptoms**: Files only saved locally, no URL returned

**Solutions**:
1. Check Firebase credentials are correct
2. Verify bucket name matches in config
3. Check service account has storage permissions
4. Look for: `Firebase Storage configured successfully` in logs

### Document Content Not Extracted

**Symptoms**: `content_length: 0` in upload response

**Solutions**:
1. Verify document processor libraries installed
2. Check file format is supported
3. Try with a `.txt` file first
4. Check server logs for extraction errors

## 🎯 **Using in Production**

### Environment Variables Checklist

- [ ] `GEMINI_API_KEY` - Gemini AI key
- [ ] `FIREBASE_SERVICE_ACCOUNT` - Path to JSON file
- [ ] `FIREBASE_STORAGE_BUCKET` - Your bucket name
- [ ] `OPENAI_API_KEY` - OpenAI key (for covers)

### Dependencies to Install

```bash
cd api
pip install -r requirements.txt
```

### Startup

```bash
# Set environment variables
export GEMINI_API_KEY="your_key"
export FIREBASE_SERVICE_ACCOUNT="/path/to/credentials.json"

# Run server
python server.py
```

## 📊 **Monitoring**

### Check Logs for Success Messages

```
INFO: Gemini AI configured successfully
INFO: Firebase Storage configured successfully
INFO: Document processor available
INFO: Analyzed manuscript for project_123 with Gemini
INFO: Uploaded to Firebase: https://storage.googleapis.com/...
```

### API Status in Response Headers

The server now includes feature flags in responses:
- `X-Gemini-Available: true/false`
- `X-Firebase-Available: true/false`
- `X-OpenAI-Available: true/false`

## 🎉 **Success Indicators**

You'll know it's working when:

1. ✅ Files upload with a Firebase URL
2. ✅ Analysis returns detailed feedback from Gemini
3. ✅ Content is extracted from actual files
4. ✅ Preview shows real manuscript content
5. ✅ Generated books contain actual content

## 📚 **Next Steps**

1. Test with real manuscript files
2. Monitor API usage and costs
3. Implement rate limiting
4. Add caching for analysis results
5. Set up error alerting

---

**Need Help?** Check the logs in `api/server.py` or review `ENV_SETUP.md` for detailed setup instructions.

