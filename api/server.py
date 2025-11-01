#!/usr/bin/env python3
"""
BookForge API Server
A Flask-based API server for handling book formatting requests
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import tempfile
import uuid
from pathlib import Path
import logging
import base64
import requests
from io import BytesIO

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import the original BookForge functionality (with error handling)
WEASYPRINT_AVAILABLE = False
try:
    from bookforge import BuildConfig, build_outputs, convert_to_html
    WEASYPRINT_AVAILABLE = True
    logger.info("BookForge PDF generation available")
except Exception as e:
    logger.error(f"Could not import bookforge: {e}")
    logger.error(f"Import error type: {type(e).__name__}")
    import traceback
    logger.error(f"Traceback: {traceback.format_exc()}")
    # Create minimal stubs for the types
    class BuildConfig:
        pass
    def build_outputs(*args, **kwargs):
        raise NotImplementedError("WeasyPrint not available")
    def convert_to_html(*args, **kwargs):
        raise NotImplementedError("WeasyPrint not available")

# OpenAI for cover generation
OPENAI_AVAILABLE = False
try:
    from openai import OpenAI
    openai_key = os.environ.get('OPENAI_API_KEY')
    if openai_key:
        OPENAI_AVAILABLE = True
        logger.info("OpenAI configured successfully")
    else:
        logger.warning("OPENAI_API_KEY not found in environment. Cover generation will be disabled.")
except ImportError:
    logger.warning("OpenAI library not available. Cover generation will be disabled.")
except Exception as e:
    logger.error(f"Error configuring OpenAI: {e}")

# Gemini AI for manuscript analysis
GEMINI_AVAILABLE = False
GEMINI_CLIENT = None
try:
    import google.generativeai as genai
    gemini_key = os.environ.get('GEMINI_API_KEY')
    if gemini_key:
        genai.configure(api_key=gemini_key)
        GEMINI_CLIENT = genai.GenerativeModel('gemini-pro')
        GEMINI_AVAILABLE = True
        logger.info("Gemini AI configured successfully")
    else:
        logger.warning("GEMINI_API_KEY not found in environment")
except ImportError:
    logger.warning("google-generativeai not available. AI features will be disabled.")
except Exception as e:
    logger.error(f"Error configuring Gemini: {e}")

# Firebase Storage
FIREBASE_AVAILABLE = False
STORAGE_CLIENT = None
try:
    import firebase_admin
    from firebase_admin import credentials, storage
    from google.cloud import storage as gcs_storage
    
    # Try to initialize Firebase
    firebase_key_path = os.environ.get('FIREBASE_SERVICE_ACCOUNT')
    firebase_config = os.environ.get('FIREBASE_CONFIG_JSON')
    
    if firebase_key_path and Path(firebase_key_path).exists():
        cred = credentials.Certificate(firebase_key_path)
        firebase_admin.initialize_app(cred, {
            'storageBucket': os.environ.get('FIREBASE_STORAGE_BUCKET', 'bookforge.appspot.com')
        })
        FIREBASE_AVAILABLE = True
        STORAGE_CLIENT = storage.bucket()
        logger.info("Firebase Storage configured successfully")
    elif firebase_config:
        import json
        cred = credentials.Certificate(json.loads(firebase_config))
        firebase_admin.initialize_app(cred, {
            'storageBucket': os.environ.get('FIREBASE_STORAGE_BUCKET', 'bookforge.appspot.com')
        })
        FIREBASE_AVAILABLE = True
        STORAGE_CLIENT = storage.bucket()
        logger.info("Firebase Storage configured successfully")
    else:
        logger.warning("Firebase credentials not found. Using local storage only.")
except ImportError:
    logger.warning("firebase-admin not available. Using local file storage only.")
except Exception as e:
    logger.error(f"Error configuring Firebase: {e}")

# Import document processor
try:
    from document_processor import extract_text_from_file
    DOCUMENT_PROCESSOR_AVAILABLE = True
except ImportError:
    DOCUMENT_PROCESSOR_AVAILABLE = False
    logger.warning("Document processor not available. Limited file support.")

# Store for active projects
projects = {}

@app.route('/api/health', methods=['GET'])
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'BookForge API',
        'version': '1.0.0',
        'gemini_available': GEMINI_AVAILABLE,
        'firebase_available': FIREBASE_AVAILABLE,
        'openai_available': OPENAI_AVAILABLE
    })

@app.route('/api/projects', methods=['POST'])
def create_project():
    """Create a new book project"""
    try:
        data = request.get_json()
        
        project_id = str(uuid.uuid4())
        project = {
            'id': project_id,
            'title': data.get('title', 'Untitled Book'),
            'author': data.get('author', ''),
            'status': 'created',
            'created_at': data.get('created_at'),
            'config': data.get('config', {}),
            'formats': []
        }
        
        projects[project_id] = project
        
        logger.info(f"Created project {project_id}")
        return jsonify(project), 201
        
    except Exception as e:
        logger.error(f"Error creating project: {str(e)}")
        return jsonify({'error': 'Failed to create project'}), 500

@app.route('/api/projects', methods=['GET'])
def get_projects():
    """Get all projects"""
    return jsonify(list(projects.values()))

@app.route('/api/projects/<project_id>', methods=['GET'])
def get_project(project_id):
    """Get a specific project"""
    if project_id not in projects:
        return jsonify({'error': 'Project not found'}), 404
    
    return jsonify(projects[project_id])

@app.route('/api/projects/<project_id>/upload', methods=['POST'])
def upload_manuscript(project_id):
    """Upload manuscript file for a project"""
    try:
        if project_id not in projects:
            return jsonify({'error': 'Project not found'}), 404
        
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Try to extract content from the file
        content = None
        if DOCUMENT_PROCESSOR_AVAILABLE:
            try:
                # Save temporarily to extract content
                temp_dir = Path(tempfile.gettempdir()) / 'bookforge_temp'
                temp_dir.mkdir(parents=True, exist_ok=True)
                temp_path = temp_dir / f"temp_{file.filename}"
                file.save(temp_path)
                
                # Extract text content
                content = extract_text_from_file(temp_path)
                logger.info(f"Extracted content from {file.filename}: {len(content) if content else 0} characters")
                
                # Delete temp file
                temp_path.unlink()
                
                # Reset file pointer for upload
                file.seek(0)
            except Exception as e:
                logger.error(f"Error extracting content: {e}")
        
        # Upload to Firebase Storage if available
        file_url = None
        if FIREBASE_AVAILABLE and STORAGE_CLIENT:
            try:
                blob = STORAGE_CLIENT.blob(f"manuscripts/{project_id}/{file.filename}")
                blob.upload_from_file(file, content_type=file.content_type)
                blob.make_public()
                file_url = blob.public_url
                logger.info(f"Uploaded to Firebase: {file_url}")
            except Exception as e:
                logger.error(f"Firebase upload failed: {e}")
        
        # Also save locally as backup
        upload_dir = Path(tempfile.gettempdir()) / 'bookforge' / project_id
        upload_dir.mkdir(parents=True, exist_ok=True)
        file_path = upload_dir / file.filename
        file.seek(0)
        file.save(file_path)
        
        # Update project
        projects[project_id]['manuscript_path'] = str(file_path)
        projects[project_id]['manuscript_url'] = file_url
        projects[project_id]['status'] = 'uploaded'
        if content:
            projects[project_id]['manuscript_content'] = content
        
        logger.info(f"Uploaded manuscript for project {project_id}")
        return jsonify({
            'message': 'File uploaded successfully',
            'filename': file.filename,
            'size': file_path.stat().st_size,
            'url': file_url,
            'content_length': len(content) if content else 0
        })
        
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        return jsonify({'error': 'Failed to upload file'}), 500

@app.route('/api/projects/<project_id>/generate-cover', methods=['POST'])
def generate_cover(project_id):
    """Generate a book cover using OpenAI DALL-E"""
    try:
        if project_id not in projects:
            return jsonify({'error': 'Project not found'}), 404
        
        if not OPENAI_AVAILABLE:
            return jsonify({'error': 'OpenAI library not available'}), 500
        
        project = projects[project_id]
        data = request.get_json()
        
        # Get book details
        title = project.get('title', 'Untitled Book')
        author = project.get('author', '')
        subtitle = project.get('config', {}).get('subtitle', '')
        
        # Get cover generation options
        cover_style = data.get('style', 'modern')
        cover_description = data.get('description', '')
        cover_theme = data.get('theme', 'professional')
        
        # Build the prompt for DALL-E
        prompt_parts = []
        
        # Style guidance
        style_guides = {
            'modern': 'modern, minimalist design with clean typography',
            'classic': 'classic book cover design with elegant typography',
            'fantasy': 'epic fantasy art style with dramatic lighting',
            'mystery': 'dark, moody atmosphere with mysterious elements',
            'romance': 'romantic, warm colors with elegant design',
            'sci-fi': 'futuristic, high-tech design with space elements',
            'non-fiction': 'professional, informative design with clear layout'
        }
        
        style_desc = style_guides.get(cover_style, style_guides['modern'])
        
        # Build full prompt
        prompt = f"A professional book cover for '{title}'"
        if subtitle:
            prompt += f" with subtitle '{subtitle}'"
        if author:
            prompt += f" by {author}"
        
        prompt += f". {style_desc}"
        
        if cover_description:
            prompt += f". {cover_description}"
        
        prompt += ". High quality, professional book cover design, suitable for print publishing. Include space for title and author name at the top."
        
        # Generate image using OpenAI DALL-E
        api_key = os.environ.get('OPENAI_API_KEY')
        if not api_key:
            return jsonify({'error': 'OpenAI API key not configured'}), 500
        
        client = OpenAI(api_key=api_key)
        
        # Generate image (1024x1024 for square covers, we'll resize later)
        response = client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1024x1024",
            quality="standard",
            n=1,
        )
        
        image_url = response.data[0].url
        
        # Download the image
        img_response = requests.get(image_url)
        img_data = img_response.content
        
        # Save cover image
        project_dir = Path(tempfile.gettempdir()) / 'bookforge' / project_id
        project_dir.mkdir(parents=True, exist_ok=True)
        cover_path = project_dir / 'cover.png'
        
        with open(cover_path, 'wb') as f:
            f.write(img_data)
        
        # Store cover info in project
        project['cover_path'] = str(cover_path)
        project['cover_url'] = image_url
        
        # Convert to base64 for frontend preview
        cover_base64 = base64.b64encode(img_data).decode('utf-8')
        
        logger.info(f"Generated cover for project {project_id}")
        return jsonify({
            'message': 'Cover generated successfully',
            'cover_url': f'data:image/png;base64,{cover_base64}',
            'cover_path': str(cover_path)
        })
        
    except Exception as e:
        logger.error(f"Error generating cover: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': f'Failed to generate cover: {str(e)}'}), 500

@app.route('/api/projects/<project_id>/cover', methods=['GET'])
def get_cover(project_id):
    """Get the cover image for a project"""
    try:
        if project_id not in projects:
            return jsonify({'error': 'Project not found'}), 404
        
        project = projects[project_id]
        
        if 'cover_path' not in project:
            return jsonify({'error': 'No cover generated'}), 404
        
        cover_path = Path(project['cover_path'])
        
        if not cover_path.exists():
            return jsonify({'error': 'Cover file not found'}), 404
        
        return send_file(cover_path, mimetype='image/png')
        
    except Exception as e:
        logger.error(f"Error getting cover: {str(e)}")
        return jsonify({'error': 'Failed to get cover'}), 500

@app.route('/api/projects/<project_id>/analyze', methods=['POST'])
def analyze_manuscript(project_id):
    """Analyze manuscript using Gemini AI"""
    try:
        if project_id not in projects:
            return jsonify({'error': 'Project not found'}), 404
        
        if not GEMINI_AVAILABLE or not GEMINI_CLIENT:
            return jsonify({'error': 'Gemini AI not available'}), 503
        
        project = projects[project_id]
        
        # Get manuscript content
        content = project.get('manuscript_content', '')
        if not content:
            return jsonify({'error': 'No manuscript content available'}), 400
        
        # Prepare prompt for Gemini
        prompt = f"""Analyze this manuscript and provide a comprehensive review. Focus on:
1. Overall writing quality and readability
2. Key strengths and areas for improvement
3. Genre classification
4. Target audience/reading level
5. Pacing and structure
6. Specific recommendations for improvement

Manuscript content (first 3000 characters):
{content[:3000]}

Provide your analysis in a structured JSON format with the following keys:
- overallScore (0-100)
- strengths (array of strings)
- improvementAreas (array of strings)
- genreGuess (string)
- readingLevel (string)
- pacing (string)
- structure (string)
- recommendations (array of objects with 'title', 'description', 'type' fields)

Be constructive and helpful in your feedback.
"""
        
        # Call Gemini API
        logger.info(f"Analyzing manuscript for project {project_id} with Gemini")
        response = GEMINI_CLIENT.generate_content(prompt)
        
        # Parse response
        analysis_text = response.text
        
        # Try to extract JSON from the response
        import json
        import re
        
        # Look for JSON in the response
        json_match = re.search(r'\{.*\}', analysis_text, re.DOTALL)
        if json_match:
            analysis = json.loads(json_match.group())
        else:
            # Fallback: create a basic analysis
            analysis = {
                'overallScore': 75,
                'strengths': ['Manuscript uploaded successfully', 'Ready for formatting'],
                'improvementAreas': ['Analysis could not be generated'],
                'genreGuess': 'Fiction',
                'readingLevel': 'Adult',
                'pacing': 'Balanced',
                'structure': 'Basic structure detected',
                'recommendations': [],
                'rawResponse': analysis_text[:500]
            }
        
        # Calculate statistics
        word_count = len(content.split())
        sentences = len(re.findall(r'[.!?]+', content))
        paragraphs = len([p for p in content.split('\n\n') if p.strip()])
        
        analysis['statistics'] = {
            'avgSentenceLength': round(word_count / sentences if sentences > 0 else 0, 1),
            'avgParagraphLength': round(word_count / paragraphs if paragraphs > 0 else 0),
            'dialoguePercentage': round((len(re.findall(r'"[^"]*"', content)) * 10) / word_count if word_count > 0 else 0, 1),
            'actionPercentage': round((len(re.findall(r'\b(ran|jumped|fell|struck|moved|grabbed)\b', content, re.I)) / word_count * 100 if word_count > 0 else 0), 2)
        }
        
        # Store analysis in project
        project['analysis'] = analysis
        
        logger.info(f"Completed manuscript analysis for project {project_id}")
        return jsonify({
            'message': 'Analysis completed successfully',
            'analysis': analysis
        })
        
    except Exception as e:
        logger.error(f"Error analyzing manuscript: {str(e)}")
        return jsonify({'error': f'Failed to analyze manuscript: {str(e)}'}), 500

@app.route('/api/projects/<project_id>/build', methods=['POST'])
def build_book(project_id):
    """Build the book from manuscript and config"""
    try:
        # Check if project exists
        if project_id not in projects:
            return jsonify({'error': 'Project not found'}), 404
        
        project = projects[project_id]
        
        # Get manuscript path or URL from project
        manuscript_path = project.get('manuscript_path')
        manuscript_url = project.get('manuscript_url')
        
        if not manuscript_path and not manuscript_url:
            return jsonify({'error': 'No manuscript found. Please upload a manuscript first.'}), 400

        # Update status
        temp_dir = Path(tempfile.gettempdir()) / 'bookforge' / project_id
        temp_dir.mkdir(parents=True, exist_ok=True)

        # Use local file if it exists, otherwise download from URL
        if manuscript_path and Path(manuscript_path).exists():
            manuscript_file = Path(manuscript_path)
            logger.info(f"Using local manuscript: {manuscript_file}")
        elif manuscript_url:
            # Download manuscript from Firebase Storage URL
            logger.info(f"Downloading manuscript from: {manuscript_url}")
            response = requests.get(manuscript_url)
            response.raise_for_status()

            # Determine file extension from URL or content-type
            content_disposition = response.headers.get('content-disposition', '')
            if 'filename=' in content_disposition:
                filename = content_disposition.split('filename=')[1].strip('"')
            else:
                # Try to get from URL or default to .txt
                filename = manuscript_url.split('/')[-1].split('?')[0] or 'manuscript.txt'

            manuscript_file = temp_dir / filename
            manuscript_file.write_bytes(response.content)
            logger.info(f"Manuscript downloaded to: {manuscript_file}")
        else:
            return jsonify({'error': 'Manuscript not found'}), 400

        # Get config from request or project
        data = request.get_json() or {}
        config_data = data.get('config', project.get('config', {}))
        
        # Convert camelCase to snake_case for BuildConfig
        def convert_to_snake_case(key):
            # Convert camelCase to snake_case
            key_map = {
                'fontFamily': 'font_family',
                'fontSize': 'font_size_pt',
                'lineHeight': 'line_height',
                'outerMargin': 'outer_margin_in',
                'topMargin': 'top_margin_in',
                'bottomMargin': 'bottom_margin_in',
                'chapterStartsRight': 'chapter_starts_right',
                'headerStyle': 'header_style',
                'includeToc': 'include_toc',
                'includeDedication': 'include_dedication',
                'dedicationText': 'dedication_text',
                'includeCopyright': 'include_copyright',
                'copyrightYear': 'copyright_year',
                'copyrightHolder': 'copyright_holder',
                'includeAck': 'include_ack',
                'ackText': 'ack_text',
                'includeAboutAuthor': 'include_about_author',
                'aboutAuthorText': 'about_author_text',
                'sceneBreak': 'scene_break'
            }
            return key_map.get(key, key)
        
        # Convert config keys
        converted_config = {convert_to_snake_case(k): v for k, v in config_data.items()}
        
        # Ensure required fields have defaults
        converted_config.setdefault('title', project.get('title', 'Untitled Book'))
        converted_config.setdefault('subtitle', '')
        converted_config.setdefault('author', project.get('author', ''))
        
        config = BuildConfig(**converted_config)

        # Build outputs
        output_dir = temp_dir / 'output'
        outputs = build_outputs(config, manuscript_file, output_dir)
        
        # Store outputs in project
        project['output_paths'] = {k: str(v) for k, v in outputs.items()}
        project['status'] = 'completed'

        logger.info(f"Built book for project {project_id}")
        return jsonify({
            'message': 'Book built successfully',
            'formats': list(outputs.keys()),
            'output_paths': {k: str(v) for k, v in outputs.items()}
        })

    except requests.RequestException as e:
        logger.error(f"Error downloading manuscript: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': f'Failed to download manuscript: {str(e)}'}), 500
    except Exception as e:
        logger.error(f"Error building book: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': f'Failed to build book: {str(e)}'}), 500

@app.route('/api/projects/<project_id>/download/<format>', methods=['GET'])
def download_book(project_id, format):
    """Download a specific format of the book"""
    try:
        if project_id not in projects:
            return jsonify({'error': 'Project not found'}), 404
        
        project = projects[project_id]
        
        if project['status'] != 'completed':
            return jsonify({'error': 'Book not ready for download'}), 400
        
        if format not in project.get('output_paths', {}):
            return jsonify({'error': 'Format not available'}), 404
        
        file_path = project['output_paths'][format]
        
        if not Path(file_path).exists():
            return jsonify({'error': 'File not found'}), 404
        
        return send_file(
            file_path,
            as_attachment=True,
            download_name=f"{project['title']}.{format}"
        )
        
    except Exception as e:
        logger.error(f"Error downloading file: {str(e)}")
        return jsonify({'error': 'Failed to download file'}), 500

@app.route('/api/projects/<project_id>', methods=['DELETE'])
def delete_project(project_id):
    """Delete a project"""
    try:
        if project_id not in projects:
            return jsonify({'error': 'Project not found'}), 404
        
        # Clean up files
        project_dir = Path(tempfile.gettempdir()) / 'bookforge' / project_id
        if project_dir.exists():
            import shutil
            shutil.rmtree(project_dir)
        
        del projects[project_id]
        
        logger.info(f"Deleted project {project_id}")
        return jsonify({'message': 'Project deleted successfully'})
        
    except Exception as e:
        logger.error(f"Error deleting project: {str(e)}")
        return jsonify({'error': 'Failed to delete project'}), 500

if __name__ == '__main__':
    # Create temp directory
    temp_dir = Path(tempfile.gettempdir()) / 'bookforge'
    temp_dir.mkdir(exist_ok=True)
    
    # Get port from environment or default to 8000
    port = int(os.environ.get('PORT', 8000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    logger.info(f"Starting BookForge API server on port {port}")
    logger.info(f"Debug mode: {debug}")
    logger.info(f"Gemini available: {GEMINI_AVAILABLE}")
    logger.info(f"Firebase available: {FIREBASE_AVAILABLE}")
    logger.info(f"OpenAI available: {OPENAI_AVAILABLE}")
    
    app.run(debug=debug, host='0.0.0.0', port=port)


