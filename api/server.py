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
# Configure CORS to allow all origins and methods - Flask-CORS will handle OPTIONS automatically
CORS(app, 
     origins="*",
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization"],
     supports_credentials=False)

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
    # Try multiple possible environment variable names
    gemini_key = (
        os.environ.get('GEMINI_API_KEY') or 
        os.environ.get('GOOGLE_AI_API_KEY') or 
        os.environ.get('GOOGLEAI_API_KEY') or
        os.environ.get('GOOGLE_GEMINI_API_KEY')
    )
    
    if gemini_key:
        # Clean the key (remove whitespace)
        gemini_key = gemini_key.strip()
        
        # Log which variable was found (without exposing the key)
        if os.environ.get('GEMINI_API_KEY'):
            logger.info("Found GEMINI_API_KEY environment variable")
        elif os.environ.get('GOOGLE_AI_API_KEY'):
            logger.info("Found GOOGLE_AI_API_KEY environment variable")
        elif os.environ.get('GOOGLEAI_API_KEY'):
            logger.info("Found GOOGLEAI_API_KEY environment variable")
        elif os.environ.get('GOOGLE_GEMINI_API_KEY'):
            logger.info("Found GOOGLE_GEMINI_API_KEY environment variable")
        
        # Validate key format (should start with AIza)
        if not gemini_key.startswith('AIza'):
            logger.warning(f"Gemini API key doesn't start with 'AIza' - may be invalid. First 10 chars: {gemini_key[:10]}...")
        
        genai.configure(api_key=gemini_key)
        # Try gemini-1.5-pro first, fall back to gemini-pro if not available
        try:
            GEMINI_CLIENT = genai.GenerativeModel('gemini-1.5-pro')
            logger.info("Gemini AI configured successfully with gemini-1.5-pro")
        except Exception as e:
            logger.warning(f"gemini-1.5-pro not available ({e}), trying gemini-pro")
            try:
                GEMINI_CLIENT = genai.GenerativeModel('gemini-pro')
                logger.info("Gemini AI configured successfully with gemini-pro")
            except Exception as e2:
                logger.error(f"Failed to initialize Gemini model: {e2}")
                raise
        GEMINI_AVAILABLE = True
    else:
        logger.warning("No Gemini API key found. Checked: GEMINI_API_KEY, GOOGLE_AI_API_KEY, GOOGLEAI_API_KEY, GOOGLE_GEMINI_API_KEY")
        # Log all environment variables that might be related (for debugging)
        gemini_vars = {k: v[:10] + '...' if len(v) > 10 else v for k, v in os.environ.items() if 'GEMINI' in k.upper() or 'GOOGLE' in k.upper() and 'API' in k.upper()}
        if gemini_vars:
            logger.info(f"Found related environment variables: {list(gemini_vars.keys())}")
except ImportError:
    logger.warning("google-generativeai not available. AI features will be disabled.")
except Exception as e:
    logger.error(f"Error configuring Gemini: {e}")
    import traceback
    logger.error(f"Traceback: {traceback.format_exc()}")

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
        'openai_available': OPENAI_AVAILABLE,
        'weasyprint_available': WEASYPRINT_AVAILABLE
    })

@app.route('/api/projects', methods=['POST'])
def create_project():
    """Create a new book project"""
    try:
        data = request.get_json()
        logger.info(f"[CREATE_PROJECT] Request data: {data}")
        
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
        
        logger.info(f"[CREATE_PROJECT] Created project {project_id}: title='{project['title']}', author='{project['author']}'")
        logger.info(f"[CREATE_PROJECT] Project state: {project}")
        return jsonify(project), 201
        
    except Exception as e:
        logger.error(f"[CREATE_PROJECT] Error creating project: {str(e)}")
        import traceback
        logger.error(f"[CREATE_PROJECT] Traceback: {traceback.format_exc()}")
        return jsonify({'error': f'Failed to create project: {str(e)}'}), 500

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

@app.route('/api/projects/<project_id>/debug', methods=['GET'])
def debug_project(project_id):
    """Debug endpoint to show detailed project state"""
    if project_id not in projects:
        return jsonify({'error': 'Project not found'}), 404
    
    project = projects[project_id]
    
    # Check file existence
    debug_info = {
        'project': project.copy(),
        'file_checks': {},
        'directory_checks': {},
        'capabilities': {
            'weasyprint_available': WEASYPRINT_AVAILABLE,
            'firebase_available': FIREBASE_AVAILABLE,
            'openai_available': OPENAI_AVAILABLE,
            'gemini_available': GEMINI_AVAILABLE,
            'document_processor_available': DOCUMENT_PROCESSOR_AVAILABLE
        }
    }
    
    # Check manuscript file
    if project.get('manuscript_path'):
        manuscript_path = Path(project['manuscript_path'])
        debug_info['file_checks']['manuscript_path'] = {
            'path': str(manuscript_path),
            'exists': manuscript_path.exists(),
            'is_file': manuscript_path.is_file() if manuscript_path.exists() else False,
            'size': manuscript_path.stat().st_size if manuscript_path.exists() else 0
        }
    
    # Check output files
    if project.get('output_paths'):
        debug_info['file_checks']['output_paths'] = {}
        for format_type, path in project['output_paths'].items():
            output_path = Path(path)
            debug_info['file_checks']['output_paths'][format_type] = {
                'path': str(output_path),
                'exists': output_path.exists(),
                'is_file': output_path.is_file() if output_path.exists() else False,
                'size': output_path.stat().st_size if output_path.exists() else 0
            }
    
    # Check project directory
    temp_dir = Path(tempfile.gettempdir()) / 'bookforge' / project_id
    debug_info['directory_checks']['project_dir'] = {
        'path': str(temp_dir),
        'exists': temp_dir.exists(),
        'is_dir': temp_dir.is_dir() if temp_dir.exists() else False
    }
    
    if temp_dir.exists():
        debug_info['directory_checks']['project_dir']['contents'] = [
            str(p.name) for p in temp_dir.iterdir()
        ]
    
    return jsonify(debug_info)

@app.route('/api/projects/<project_id>/upload', methods=['POST'])
def upload_manuscript(project_id):
    """Upload manuscript file for a project"""
    try:
        logger.info(f"[UPLOAD] Starting upload for project {project_id}")
        
        if project_id not in projects:
            logger.error(f"[UPLOAD] Project {project_id} not found")
            return jsonify({'error': 'Project not found'}), 404
        
        logger.info(f"[UPLOAD] Project found: {projects[project_id].get('title', 'Unknown')}")
        
        if 'file' not in request.files:
            logger.error(f"[UPLOAD] No file in request.files")
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        logger.info(f"[UPLOAD] File received: {file.filename}, size: {file.content_length or 'unknown'}, type: {file.content_type}")
        
        if file.filename == '':
            logger.error(f"[UPLOAD] Empty filename")
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
        
        # Upload to Firebase Storage if available and bucket is configured
        file_url = None
        storage_bucket = os.environ.get('FIREBASE_STORAGE_BUCKET')
        if FIREBASE_AVAILABLE and STORAGE_CLIENT and storage_bucket:
            try:
                blob = STORAGE_CLIENT.blob(f"manuscripts/{project_id}/{file.filename}")
                blob.upload_from_file(file, content_type=file.content_type)
                blob.make_public()
                file_url = blob.public_url
                logger.info(f"Uploaded to Firebase: {file_url}")
            except Exception as e:
                # Firebase upload failure is non-critical - file is saved locally
                logger.warning(f"Firebase upload failed (using local storage): {e}")
        elif FIREBASE_AVAILABLE and not storage_bucket:
            logger.warning("Firebase Storage bucket not configured (FIREBASE_STORAGE_BUCKET env var not set). Using local storage only.")
        
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
            logger.info(f"[UPLOAD] Extracted {len(content)} characters of content")
            
            # Auto-trigger AI analysis if Gemini is available (optional, can be done async)
            # This allows immediate AI analysis after upload
            if GEMINI_AVAILABLE and GEMINI_CLIENT:
                try:
                    # Run analysis in background (don't block response)
                    import threading
                    def analyze_background():
                        try:
                            # Use the analyze endpoint logic
                            content_sample = content[:10000] if len(content) > 10000 else content
                            prompt = f"""You are a professional book editor. Analyze this manuscript excerpt and provide:

1. Title suggestions (3-5 options)
2. Subtitle suggestions (2-3 options)  
3. Recommended trim size (5x8, 5.5x8.5, 6x9, or 8.5x11) with reasoning
4. Genre classification
5. Brief quality assessment

Manuscript excerpt:
{content_sample}

Return JSON:
{{
  "titleSuggestions": ["title1", "title2", ...],
  "subtitleSuggestions": ["subtitle1", ...],
  "recommendedTrim": "6x9",
  "trimReason": "reasoning",
  "genreGuess": "genre",
  "qualityScore": 75
}}"""
                            try:
                                response = GEMINI_CLIENT.generate_content(prompt)
                            except Exception as gemini_error:
                                # Try fallback to gemini-pro if gemini-1.5-pro fails
                                error_str = str(gemini_error)
                                if ('not found' in error_str.lower() or 'NotFound' in type(gemini_error).__name__) and 'gemini-1.5-pro' in error_str:
                                    logger.warning(f"[UPLOAD] gemini-1.5-pro not available in background, trying gemini-pro fallback")
                                    try:
                                        fallback_client = genai.GenerativeModel('gemini-pro')
                                        response = fallback_client.generate_content(prompt)
                                        global GEMINI_CLIENT
                                        GEMINI_CLIENT = fallback_client
                                    except Exception:
                                        raise gemini_error
                                else:
                                    raise
                            
                            analysis_text = response.text
                            import json
                            import re
                            json_match = re.search(r'\{.*\}', analysis_text, re.DOTALL)
                            if json_match:
                                analysis = json.loads(json_match.group())
                                projects[project_id]['ai_analysis'] = analysis
                                logger.info(f"[UPLOAD] Background AI analysis completed for {project_id}")
                        except Exception as e:
                            logger.warning(f"[UPLOAD] Background analysis failed: {e}")
                    
                    threading.Thread(target=analyze_background, daemon=True).start()
                except Exception as e:
                    logger.warning(f"[UPLOAD] Failed to start background analysis: {e}")
        
        logger.info(f"[UPLOAD] Uploaded manuscript for project {project_id}")
        logger.info(f"[UPLOAD] Project state after upload: status={projects[project_id]['status']}, manuscript_path={projects[project_id].get('manuscript_path')}, manuscript_url={projects[project_id].get('manuscript_url')}")
        logger.info(f"[UPLOAD] File saved to: {file_path}, exists: {file_path.exists()}, size: {file_path.stat().st_size if file_path.exists() else 0}")
        
        return jsonify({
            'message': 'File uploaded successfully',
            'filename': file.filename,
            'size': file_path.stat().st_size,
            'url': file_url,
            'content_length': len(content) if content else 0,
            'content': content  # Include extracted content in response
        })
        
    except Exception as e:
        logger.error(f"[UPLOAD] Error uploading file: {str(e)}")
        import traceback
        logger.error(f"[UPLOAD] Traceback: {traceback.format_exc()}")
        return jsonify({'error': f'Failed to upload file: {str(e)}'}), 500

@app.route('/api/extract-text', methods=['POST'])
def extract_text():
    """Extract text content from an uploaded file"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not DOCUMENT_PROCESSOR_AVAILABLE:
            return jsonify({'error': 'Document processor not available'}), 503
        
        # Check if HTML extraction is requested (for images)
        extract_html = request.form.get('html', 'false').lower() == 'true'
        
        # Save temporarily to extract content
        temp_dir = Path(tempfile.gettempdir()) / 'bookforge_temp'
        temp_dir.mkdir(parents=True, exist_ok=True)
        temp_path = temp_dir / f"extract_{uuid.uuid4()}_{file.filename}"
        file.save(temp_path)
        
        try:
            if extract_html:
                # Extract HTML content with images
                from document_processor import extract_html_from_file
                html_result = extract_html_from_file(temp_path)
                if html_result:
                    return jsonify({
                        'success': True,
                        'content': html_result['html'],
                        'format': html_result['format'],
                        'length': len(html_result['html'])
                    })
                else:
                    return jsonify({
                        'success': False,
                        'error': 'Could not extract HTML from file'
                    }), 400
            else:
                # Extract plain text content
                content = extract_text_from_file(temp_path)
                if content:
                    return jsonify({
                        'success': True,
                        'content': content,
                        'format': 'text',
                        'length': len(content)
                    })
                else:
                    return jsonify({
                        'success': False,
                        'error': 'Could not extract text from file'
                    }), 400
        finally:
            # Clean up temp file
            if temp_path.exists():
                temp_path.unlink()
        
    except Exception as e:
        logger.error(f"Error extracting text: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': f'Failed to extract text: {str(e)}'}), 500

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
        color_palette = data.get('colorPalette', 'auto')
        visual_style = data.get('visualStyle', 'illustrated')  # illustrated, photographic, mixed
        mood = data.get('mood', 'neutral')  # neutral, energetic, calm, dramatic, mysterious, warm
        
        # Auto-generate cover description from manuscript if not provided and manuscript is available
        if not cover_description and GEMINI_AVAILABLE and GEMINI_CLIENT:
            manuscript_content = project.get('manuscript_content', '')
            if manuscript_content:
                try:
                    # Use Gemini to analyze manuscript and suggest cover visual elements
                    analysis_prompt = f"""Based on this book manuscript excerpt, suggest specific visual elements, scenes, or imagery that would be appropriate for a book cover.

Book Title: {title}
Book Subtitle: {subtitle if subtitle else 'None'}
Author: {author}

Manuscript excerpt (first 2000 characters):
{manuscript_content[:2000]}

Provide a concise description (2-3 sentences) of visual elements that would work well for the cover, such as:
- Key scenes or settings
- Important objects or symbols
- Mood and atmosphere
- Color suggestions

Return ONLY the description text, no additional commentary or formatting."""
                    
                    try:
                        analysis_response = GEMINI_CLIENT.generate_content(analysis_prompt)
                    except Exception as gemini_error:
                        # Try fallback to gemini-pro if gemini-1.5-pro fails
                        error_str = str(gemini_error)
                        if ('not found' in error_str.lower() or 'NotFound' in type(gemini_error).__name__) and 'gemini-1.5-pro' in error_str:
                            logger.warning(f"[COVER] gemini-1.5-pro not available, trying gemini-pro fallback")
                            try:
                                fallback_client = genai.GenerativeModel('gemini-pro')
                                analysis_response = fallback_client.generate_content(analysis_prompt)
                                global GEMINI_CLIENT
                                GEMINI_CLIENT = fallback_client
                            except Exception:
                                raise gemini_error
                        else:
                            raise
                    
                    # Handle different response formats
                    if hasattr(analysis_response, 'text'):
                        ai_suggested_description = analysis_response.text.strip()
                    elif hasattr(analysis_response, 'candidates') and len(analysis_response.candidates) > 0:
                        candidate = analysis_response.candidates[0]
                        if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                            ai_suggested_description = candidate.content.parts[0].text.strip()
                        else:
                            ai_suggested_description = str(candidate).strip()
                    else:
                        ai_suggested_description = str(analysis_response).strip()
                    if ai_suggested_description:
                        cover_description = ai_suggested_description
                        logger.info(f"[COVER] Auto-generated description from manuscript: {cover_description[:100]}...")
                except Exception as e:
                    logger.warning(f"[COVER] Failed to generate description from manuscript: {e}")
                    # Continue without auto-generated description
        
        # Build the prompt for DALL-E with enhanced structure
        prompt_parts = []
        
        # Comprehensive style guidance with more detail
        style_guides = {
            'modern': {
                'base': 'modern minimalist book cover design',
                'details': 'clean typography, ample white space, geometric shapes, contemporary aesthetic',
                'colors': 'bold contrasting colors or monochromatic palette'
            },
            'classic': {
                'base': 'classic elegant book cover design',
                'details': 'traditional typography, ornate borders or frames, timeless aesthetic',
                'colors': 'rich deep colors, gold accents, vintage color palette'
            },
            'fantasy': {
                'base': 'epic fantasy book cover artwork',
                'details': 'dramatic lighting, mythical creatures or magical elements, epic landscapes, detailed illustration',
                'colors': 'vibrant colors with deep shadows, mystical lighting effects'
            },
            'mystery': {
                'base': 'dark atmospheric mystery book cover',
                'details': 'moody shadows, mysterious silhouettes, noir aesthetic, intriguing details',
                'colors': 'dark color palette with dramatic contrast, noir black and white with accent colors'
            },
            'romance': {
                'base': 'romantic elegant book cover design',
                'details': 'soft flowing elements, elegant typography, warm intimate atmosphere',
                'colors': 'warm romantic colors, pastels, soft gradients, rose and cream tones'
            },
            'sci-fi': {
                'base': 'futuristic sci-fi book cover design',
                'details': 'high-tech elements, space themes, futuristic architecture, sleek design',
                'colors': 'cool high-tech colors, neon accents, metallic surfaces, space blues and purples'
            },
            'non-fiction': {
                'base': 'professional informative book cover',
                'details': 'clear hierarchy, readable typography, professional layout, informative imagery',
                'colors': 'professional color scheme, clean and organized, business-appropriate'
            },
            'thriller': {
                'base': 'high-tension thriller book cover',
                'details': 'dynamic composition, action elements, intense atmosphere, gripping imagery',
                'colors': 'high contrast, bold colors, dramatic shadows, tension-building palette'
            },
            'historical': {
                'base': 'vintage historical book cover design',
                'details': 'period-appropriate aesthetic, antique elements, classic typography, timeless design',
                'colors': 'vintage color palette, sepia tones, aged paper aesthetic, historical colors'
            },
            'horror': {
                'base': 'chilling horror book cover',
                'details': 'dark atmosphere, unsettling imagery, gothic elements, haunting aesthetic',
                'colors': 'dark menacing colors, blood red accents, deep shadows, eerie lighting'
            },
            'business': {
                'base': 'professional business book cover',
                'details': 'corporate design, clean modern layout, professional imagery, authoritative',
                'colors': 'corporate blues and grays, professional color scheme, business-appropriate'
            },
            'self-help': {
                'base': 'inspiring self-help book cover',
                'details': 'uplifting imagery, positive energy, motivational elements, approachable design',
                'colors': 'bright inspiring colors, optimistic palette, energetic tones'
            }
        }
        
        style_info = style_guides.get(cover_style, style_guides['modern'])
        
        # Color palette overrides
        color_palettes = {
            'warm': 'warm color palette with oranges, reds, and yellows',
            'cool': 'cool color palette with blues, greens, and purples',
            'monochrome': 'monochromatic color scheme in black, white, and grays',
            'bold': 'vibrant bold colors with high saturation and contrast',
            'pastel': 'soft pastel color palette with gentle tones',
            'dark': 'dark moody color palette with deep shadows',
            'bright': 'bright cheerful color palette with high energy',
            'auto': style_info['colors']  # Use style default
        }
        
        # Visual style modifiers
        visual_styles = {
            'illustrated': 'hand-drawn or digital illustration style, artistic rendering',
            'photographic': 'high-quality photography with professional lighting and composition',
            'mixed': 'combination of photography and illustration elements, photorealistic mixed media',
            'graphic': 'graphic design elements, abstract shapes, typography-focused',
            'painterly': 'painterly artistic style, brushstroke textures, artistic interpretation'
        }
        
        # Mood modifiers
        mood_descriptors = {
            'energetic': 'dynamic energetic atmosphere with movement and action',
            'calm': 'peaceful serene atmosphere with tranquil elements',
            'dramatic': 'dramatic intense atmosphere with strong emotional impact',
            'mysterious': 'mysterious enigmatic atmosphere with intrigue and suspense',
            'warm': 'warm inviting atmosphere with friendly welcoming feeling',
            'neutral': ''  # No mood modifier
        }
        
        # Build comprehensive prompt
        prompt = f"Professional book cover design for the book '{title}'"
        
        if subtitle:
            prompt += f", subtitled '{subtitle}'"
        if author:
            prompt += f", written by {author}"
        
        prompt += f". {style_info['base']}, {style_info['details']}"
        
        # Add visual style
        prompt += f". Style: {visual_styles.get(visual_style, visual_styles['illustrated'])}"
        
        # Add color palette
        color_desc = color_palettes.get(color_palette, color_palettes['auto'])
        prompt += f". Color scheme: {color_desc}"
        
        # Add mood if specified
        if mood != 'neutral':
            prompt += f". Mood: {mood_descriptors.get(mood, '')}"
        
        # Add custom description
        if cover_description:
            prompt += f". Additional details: {cover_description}"
        
        # Professional book cover requirements
        prompt += ". High-quality professional book cover design suitable for print publishing. "
        prompt += "The design should have a clear focal point, excellent composition, and professional typography area at the top for title and author. "
        prompt += "The cover should be visually striking and appropriate for bookstore display. "
        prompt += "Do not include any text overlay - leave space for title and author name to be added later."
        
        # Generate image using OpenAI DALL-E
        api_key = os.environ.get('OPENAI_API_KEY')
        if not api_key:
            return jsonify({'error': 'OpenAI API key not configured'}), 500
        
        client = OpenAI(api_key=api_key)
        
        # Get trim size for aspect ratio
        trim = project.get('config', {}).get('trim', '6x9')
        trim_dimensions = {
            '5x8': {'width': 5, 'height': 8},
            '5.5x8.5': {'width': 5.5, 'height': 8.5},
            '6x9': {'width': 6, 'height': 9},
            '8.5x11': {'width': 8.5, 'height': 11}
        }
        
        # Calculate aspect ratio for book cover (front cover only, not full spread)
        trim_info = trim_dimensions.get(trim, trim_dimensions['6x9'])
        aspect_ratio = trim_info['width'] / trim_info['height']
        
        # DALL-E 3 supports: 1024x1024 (1:1), 1024x1792 (portrait), 1792x1024 (landscape)
        # For book covers, we want portrait orientation
        # Use 1024x1792 for most books (approximately 9:16 aspect ratio)
        size = "1024x1792"  # Portrait orientation for book covers
        
        # Generate image with HD quality for better results
        response = client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size=size,
            quality="hd",  # Use HD quality for better detail and resolution
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
        
        # Strip HTML tags if content is HTML (from DOCX extraction)
        import re
        if content.strip().startswith('<') and '</' in content:
            # Remove HTML tags but keep text content
            content = re.sub(r'<[^>]+>', ' ', content)
            content = re.sub(r'\s+', ' ', content).strip()
            logger.info("Stripped HTML tags from content for analysis")
        
        # Enhanced prompt for professional manuscript analysis
        # Use more content for better analysis (Gemini 1.5 Pro supports larger context)
        content_sample = content[:10000] if len(content) > 10000 else content
        
        prompt = f"""You are a professional book editor and formatter with expertise in print-ready book design.

Analyze this manuscript and provide a comprehensive professional review. Focus on:

1. **Overall Writing Quality** (0-100 score)
   - Writing style and voice
   - Readability and flow
   - Professional polish

2. **Key Strengths**
   - What works well in the writing
   - Strong elements (dialogue, description, pacing, etc.)
   - Professional qualities

3. **Areas for Improvement**
   - Specific, actionable suggestions
   - Writing craft improvements
   - Structural enhancements

4. **Genre Classification**
   - Primary genre (Mystery, Romance, Fantasy, Literary Fiction, etc.)
   - Sub-genre if applicable
   - Market positioning

5. **Target Audience & Reading Level**
   - Appropriate reading level (Middle Grade, Young Adult, Adult, Literary)
   - Target demographic
   - Market appeal

6. **Pacing Analysis**
   - Overall pacing (fast-paced, contemplative, balanced)
   - Scene transitions
   - Chapter structure

7. **Structure Assessment**
   - Chapter organization quality
   - Paragraph structure
   - Overall narrative flow

8. **Professional Recommendations**
   - Formatting suggestions (trim size, fonts, layout)
   - Content improvements
   - Publishing readiness

Manuscript content (first 10,000 characters):
{content_sample}

Provide your analysis in a structured JSON format with the following exact structure:
{{
  "overallScore": <number 0-100>,
  "strengths": ["strength 1", "strength 2", ...],
  "improvementAreas": ["area 1", "area 2", ...],
  "genreGuess": "<genre>",
  "readingLevel": "<level>",
  "pacing": "<pacing description>",
  "structure": "<structure assessment>",
  "recommendations": [
    {{"title": "Recommendation title", "description": "Detailed description", "type": "info|warning|suggestion"}},
    ...
  ]
}}

Be specific, constructive, and professional in your feedback. Focus on actionable insights that will help create a polished, publication-ready book.
"""
        
        # Call Gemini API with improved error handling
        logger.info(f"Analyzing manuscript for project {project_id}")
        logger.info(f"Content length: {len(content)} characters, sample length: {len(content_sample)} characters")
        
        import json
        import re
        
        analysis_text = None
        try:
            response = GEMINI_CLIENT.generate_content(prompt)
            
            # Handle Gemini API response (google-generativeai 0.3.2 uses .text attribute)
            try:
                # Try direct .text attribute (standard for google-generativeai)
                analysis_text = response.text
                logger.info("Successfully accessed response.text")
            except AttributeError:
                # Fallback: try alternative formats
                try:
                    if hasattr(response, 'candidates') and len(response.candidates) > 0:
                        candidate = response.candidates[0]
                        if hasattr(candidate, 'content'):
                            if hasattr(candidate.content, 'parts') and len(candidate.content.parts) > 0:
                                analysis_text = candidate.content.parts[0].text
                            elif hasattr(candidate.content, 'text'):
                                analysis_text = candidate.content.text
                    if not analysis_text:
                        analysis_text = str(response)
                except Exception as fallback_err:
                    logger.error(f"Fallback response handling failed: {fallback_err}")
                    analysis_text = str(response)
            
            if not analysis_text or len(analysis_text.strip()) == 0:
                raise ValueError("Empty response from Gemini API")
            
            logger.info(f"Gemini response received, length: {len(analysis_text)} characters")
            
        except Exception as gemini_error:
            # Check if it's a model not found error - try fallback to gemini-pro
            error_str = str(gemini_error)
            error_type = type(gemini_error).__name__
            
            # Try fallback to gemini-pro if gemini-1.5-pro fails
            if ('not found' in error_str.lower() or 'NotFound' in error_type) and 'gemini-1.5-pro' in error_str:
                logger.warning(f"gemini-1.5-pro not available, trying gemini-pro fallback: {error_str}")
                try:
                    # Create fallback client with gemini-pro
                    fallback_client = genai.GenerativeModel('gemini-pro')
                    response = fallback_client.generate_content(prompt)
                    # Update global client for future calls
                    global GEMINI_CLIENT
                    GEMINI_CLIENT = fallback_client
                    logger.info("Successfully using gemini-pro as fallback")
                    
                    # Handle response
                    try:
                        analysis_text = response.text
                    except AttributeError:
                        if hasattr(response, 'candidates') and len(response.candidates) > 0:
                            candidate = response.candidates[0]
                            if hasattr(candidate, 'content'):
                                if hasattr(candidate.content, 'parts') and len(candidate.content.parts) > 0:
                                    analysis_text = candidate.content.parts[0].text
                                elif hasattr(candidate.content, 'text'):
                                    analysis_text = candidate.content.text
                        if not analysis_text:
                            analysis_text = str(response)
                    
                    if analysis_text and len(analysis_text.strip()) > 0:
                        logger.info(f"Gemini-pro response received, length: {len(analysis_text)} characters")
                    else:
                        raise ValueError("Empty response from Gemini API fallback")
                except Exception as fallback_error:
                    logger.error(f"Fallback to gemini-pro also failed: {fallback_error}")
                    # Continue to error handling below
                    gemini_error = fallback_error
                    error_str = str(fallback_error)
            
            # Check if it's an API key error
            if 'API key' in error_str or 'API_KEY' in error_str or 'API key not valid' in error_str:
                logger.error(f"Gemini API key error: {error_str}")
                return jsonify({
                    'error': 'Gemini API key is invalid or not set. Please check GEMINI_API_KEY environment variable.',
                    'errorType': 'API_KEY_INVALID',
                    'overallScore': 70,
                    'strengths': ['Manuscript uploaded successfully'],
                    'improvementAreas': ['AI analysis unavailable: Invalid API key'],
                    'genreGuess': 'Fiction',
                    'readingLevel': 'Adult',
                    'pacing': 'Balanced',
                    'structure': 'Basic structure detected',
                    'recommendations': [],
                    'statistics': {
                        'wordCount': len(content.split()),
                        'estimatedPages': round(len(content.split()) / 250)
                    }
                }), 500
            
            # If we still don't have analysis_text, return error
            if not analysis_text:
                logger.error(f"Gemini API call failed: {str(gemini_error)}")
                logger.error(f"Error type: {type(gemini_error).__name__}")
                import traceback
                logger.error(f"Traceback: {traceback.format_exc()}")
                # Return error with detailed info for debugging
                error_message = str(gemini_error)
                return jsonify({
                    'error': f'Gemini API error: {error_message}',
                    'errorType': type(gemini_error).__name__,
                    'overallScore': 70,
                    'strengths': ['Manuscript uploaded successfully'],
                    'improvementAreas': [f'AI analysis unavailable: {error_message[:100]}'],
                    'genreGuess': 'Fiction',
                    'readingLevel': 'Adult',
                    'pacing': 'Balanced',
                    'structure': 'Basic structure detected',
                    'recommendations': [],
                    'statistics': {
                        'wordCount': len(content.split()),
                        'estimatedPages': round(len(content.split()) / 250)
                    }
                }), 500
        
        # Ensure analysis_text is defined
        if not analysis_text:
            logger.error("analysis_text is None or empty after Gemini call")
            analysis_text = ""
        
        # Try to extract JSON from the response
        analysis = None
        try:
            # Look for JSON in the response (improved pattern)
            json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', analysis_text, re.DOTALL)
            if json_match:
                try:
                    analysis = json.loads(json_match.group())
                    logger.info("Successfully parsed JSON from Gemini response")
                except json.JSONDecodeError as json_err:
                    logger.warning(f"JSON decode error: {json_err}, trying alternative extraction")
                    # Try alternative JSON extraction
                    json_match = re.search(r'```json\s*(\{.*?\})\s*```', analysis_text, re.DOTALL)
                    if json_match:
                        analysis = json.loads(json_match.group(1))
        except Exception as parse_error:
            logger.warning(f"JSON parsing error: {parse_error}")
        
        # If JSON parsing failed, create fallback analysis
        if not analysis:
            logger.warning("Could not parse JSON from Gemini response, using fallback")
            analysis = {
                'overallScore': 75,
                'strengths': ['Manuscript uploaded successfully', 'Ready for formatting'],
                'improvementAreas': ['AI analysis format could not be parsed'],
                'genreGuess': 'Fiction',
                'readingLevel': 'Adult',
                'pacing': 'Balanced',
                'structure': 'Basic structure detected',
                'recommendations': [],
                'rawResponse': analysis_text[:1000] if len(analysis_text) > 0 else 'No response'
            }
        
        # Calculate enhanced statistics
        words = content.split()
        word_count = len(words)
        sentences = len(re.findall(r'[.!?]+', content))
        paragraphs = len([p for p in content.split('\n\n') if p.strip()])
        
        # Enhanced dialogue calculation
        dialogue_matches = re.findall(r'"[^"]*"', content)
        dialogue_words = sum(len(d.replace('"', '').split()) for d in dialogue_matches)
        dialogue_percentage = round((dialogue_words / word_count * 100) if word_count > 0 else 0, 1)
        
        # Enhanced action verb detection
        action_verbs = r'\b(ran|jumped|fell|struck|hit|moved|grabbed|threw|pushed|pulled|fought|attacked|defended|walked|ran|sprinted|dashed)\b'
        action_matches = len(re.findall(action_verbs, content, re.I))
        action_percentage = round((action_matches / word_count * 100) if word_count > 0 else 0, 2)
        
        analysis['statistics'] = {
            'avgSentenceLength': round(word_count / sentences if sentences > 0 else 0, 1),
            'avgParagraphLength': round(word_count / paragraphs if paragraphs > 0 else 0),
            'dialoguePercentage': dialogue_percentage,
            'actionPercentage': action_percentage,
            'wordCount': word_count,
            'estimatedPages': round(word_count / 250)  # ~250 words per page
        }
        
        # Add title/subtitle suggestions if not already present
        if 'titleSuggestions' not in analysis or not analysis.get('titleSuggestions'):
            # Generate basic title suggestions from content
            first_lines = content.split('\n')[:5]
            potential_titles = [line.strip() for line in first_lines if len(line.strip()) > 5 and len(line.strip()) < 80]
            analysis['titleSuggestions'] = potential_titles[:3] if potential_titles else []
        
        # Add trim size recommendation if not present
        if 'recommendedTrim' not in analysis:
            estimated_pages = round(word_count / 250)
            if estimated_pages < 100:
                analysis['recommendedTrim'] = '5x8'
                analysis['trimReason'] = 'Ideal for shorter books (under 100 pages)'
            elif estimated_pages < 250:
                analysis['recommendedTrim'] = '5.5x8.5'
                analysis['trimReason'] = 'Great for medium-length books (100-250 pages)'
            else:
                analysis['recommendedTrim'] = '6x9'
                analysis['trimReason'] = 'Perfect for standard novels (250+ pages)'
        
        # Store analysis in project
        project['analysis'] = analysis
        project['ai_analysis'] = analysis  # Also store for quick access
        
        logger.info(f"Completed manuscript analysis for project {project_id}")
        # Return analysis directly (not wrapped) for easier frontend consumption
        return jsonify(analysis)
        
    except Exception as e:
        logger.error(f"Error analyzing manuscript: {str(e)}")
        return jsonify({'error': f'Failed to analyze manuscript: {str(e)}'}), 500

@app.route('/api/projects/<project_id>/build', methods=['POST'])
def build_book(project_id):
    """Build the book from manuscript and config"""
    try:
        logger.info(f"[BUILD] Starting build for project {project_id}")
        
        # Check if project exists
        if project_id not in projects:
            logger.error(f"[BUILD] Project {project_id} not found")
            return jsonify({'error': 'Project not found'}), 404
        
        project = projects[project_id]
        logger.info(f"[BUILD] Project found: {project.get('title', 'Unknown')}, status: {project.get('status')}")
        
        # Get manuscript path or URL from project
        manuscript_path = project.get('manuscript_path')
        manuscript_url = project.get('manuscript_url')
        
        logger.info(f"[BUILD] Manuscript path: {manuscript_path}")
        logger.info(f"[BUILD] Manuscript URL: {manuscript_url}")
        
        if not manuscript_path and not manuscript_url:
            logger.error(f"[BUILD] No manuscript found in project")
            return jsonify({'error': 'No manuscript found. Please upload a manuscript first.'}), 400

        # Update status
        temp_dir = Path(tempfile.gettempdir()) / 'bookforge' / project_id
        temp_dir.mkdir(parents=True, exist_ok=True)

        # Use local file if it exists, otherwise download from URL
        if manuscript_path and Path(manuscript_path).exists():
            manuscript_file = Path(manuscript_path)
            logger.info(f"[BUILD] Using local manuscript: {manuscript_file}, size: {manuscript_file.stat().st_size}")
        elif manuscript_url:
            # Download manuscript from Firebase Storage URL
            logger.info(f"[BUILD] Downloading manuscript from: {manuscript_url}")
            response = requests.get(manuscript_url)
            response.raise_for_status()
            logger.info(f"[BUILD] Download successful, size: {len(response.content)} bytes")

            # Determine file extension from URL or content-type
            content_disposition = response.headers.get('content-disposition', '')
            if 'filename=' in content_disposition:
                filename = content_disposition.split('filename=')[1].strip('"')
            else:
                # Try to get from URL or default to .txt
                filename = manuscript_url.split('/')[-1].split('?')[0] or 'manuscript.txt'

            manuscript_file = temp_dir / filename
            manuscript_file.write_bytes(response.content)
            logger.info(f"[BUILD] Manuscript downloaded to: {manuscript_file}, exists: {manuscript_file.exists()}, size: {manuscript_file.stat().st_size if manuscript_file.exists() else 0}")
        else:
            logger.error(f"[BUILD] Neither manuscript_path exists nor manuscript_url provided")
            return jsonify({'error': 'Manuscript not found'}), 400

        # Get config from request or project
        data = request.get_json(force=True, silent=True) or {}
        config_data = data.get('config', project.get('config', {}))
        logger.info(f"[BUILD] Config data: {config_data}")
        
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
                'gutter': 'gutter_in',
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
        logger.info(f"[BUILD] Converted config: {converted_config}")
        
        # Ensure required fields have defaults
        converted_config.setdefault('title', project.get('title', 'Untitled Book'))
        converted_config.setdefault('subtitle', '')
        converted_config.setdefault('author', project.get('author', ''))
        
        logger.info(f"[BUILD] Creating BuildConfig with WEASYPRINT_AVAILABLE={WEASYPRINT_AVAILABLE}")
        logger.info(f"[BUILD] Config keys being passed: {list(converted_config.keys())}")
        try:
            config = BuildConfig(**converted_config)
            logger.info(f"[BUILD] BuildConfig created successfully")
        except TypeError as e:
            logger.error(f"[BUILD] Failed to create BuildConfig: {str(e)}")
            logger.error(f"[BUILD] This usually means a required field is missing or an invalid field was provided")
            import traceback
            logger.error(f"[BUILD] Traceback: {traceback.format_exc()}")
            return jsonify({'error': f'Invalid configuration: {str(e)}'}), 400

        # Build outputs
        output_dir = temp_dir / 'output'
        logger.info(f"[BUILD] Output directory: {output_dir}")
        logger.info(f"[BUILD] Calling build_outputs with config title='{config.title}', manuscript_file={manuscript_file}")
        
        if not WEASYPRINT_AVAILABLE:
            logger.error(f"[BUILD] WeasyPrint not available! Cannot build outputs.")
            return jsonify({'error': 'WeasyPrint not available. Cannot generate PDF.'}), 500
        
        outputs = build_outputs(config, manuscript_file, output_dir)
        logger.info(f"[BUILD] build_outputs returned: {outputs}")
        
        # Store outputs in project
        project['output_paths'] = {k: str(v) for k, v in outputs.items()}
        project['status'] = 'completed'

        logger.info(f"[BUILD] Built book for project {project_id}")
        logger.info(f"[BUILD] Output paths: {project['output_paths']}")
        logger.info(f"[BUILD] Final project status: {project['status']}")
        
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
        import traceback
        error_trace = traceback.format_exc()
        logger.error(f"Error building book: {str(e)}")
        logger.error(f"Traceback: {error_trace}")
        return jsonify({'error': f'Failed to build book: {str(e)}', 'trace': error_trace[-500:]}), 500

@app.route('/api/projects/<project_id>/preview', methods=['GET', 'POST'])
def preview_book(project_id):
    """Generate a preview PDF of the book"""
    # Flask-CORS handles OPTIONS automatically
    try:
        logger.info(f"[PREVIEW] Starting preview for project {project_id}")
        
        if project_id not in projects:
            logger.error(f"[PREVIEW] Project {project_id} not found")
            response = jsonify({'error': 'Project not found'})
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response, 404
        
        project = projects[project_id]
        
        # Get manuscript path or URL
        manuscript_path = project.get('manuscript_path')
        manuscript_url = project.get('manuscript_url')
        
        if not manuscript_path and not manuscript_url:
            logger.error(f"[PREVIEW] No manuscript found")
            response = jsonify({'error': 'No manuscript found. Please upload a manuscript first.'})
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response, 400
        
        # Get config from request body (POST) or project (GET)
        if request.method == 'POST':
            request_data = request.get_json(force=True, silent=True) or {}
            config_data = request_data.get('config', project.get('config', {}))
            # Update project config with latest values
            project['config'] = {**project.get('config', {}), **config_data}
        else:
            config_data = project.get('config', {})
        
        # Convert camelCase to snake_case for BuildConfig
        def convert_to_snake_case(key):
            key_map = {
                'fontFamily': 'font_family',
                'fontSize': 'font_size_pt',
                'lineHeight': 'line_height',
                'outerMargin': 'outer_margin_in',
                'topMargin': 'top_margin_in',
                'bottomMargin': 'bottom_margin_in',
                'gutter': 'gutter_in',
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
        
        # Create BuildConfig
        if not WEASYPRINT_AVAILABLE:
            return jsonify({'error': 'WeasyPrint not available. Cannot generate preview.'}), 500
        
        config = BuildConfig(**converted_config)
        
        # Prepare manuscript file
        temp_dir = Path(tempfile.gettempdir()) / 'bookforge' / project_id
        temp_dir.mkdir(parents=True, exist_ok=True)
        
        if manuscript_path and Path(manuscript_path).exists():
            manuscript_file = Path(manuscript_path)
        elif manuscript_url:
            response = requests.get(manuscript_url)
            response.raise_for_status()
            filename = manuscript_url.split('/')[-1].split('?')[0] or 'manuscript.txt'
            manuscript_file = temp_dir / filename
            manuscript_file.write_bytes(response.content)
        else:
            response = jsonify({'error': 'Manuscript not found'})
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response, 400
        
        # Build preview (PDF only)
        preview_dir = temp_dir / 'preview'
        preview_dir.mkdir(exist_ok=True)
        
        outputs = build_outputs(config, manuscript_file, preview_dir)
        
        # Return PDF preview
        if 'pdf' not in outputs:
            response = jsonify({'error': 'Failed to generate preview PDF'})
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response, 500
        
        pdf_path = outputs['pdf']
        if not Path(pdf_path).exists():
            response = jsonify({'error': 'Preview PDF not found'})
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response, 404
        
        logger.info(f"[PREVIEW] Preview generated successfully: {pdf_path}")
        response = send_file(
            pdf_path,
            mimetype='application/pdf',
            download_name=f"{project['title']}_preview.pdf"
        )
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
        
    except Exception as e:
        logger.error(f"[PREVIEW] Error generating preview: {str(e)}")
        import traceback
        logger.error(f"[PREVIEW] Traceback: {traceback.format_exc()}")
        response = jsonify({'error': f'Failed to generate preview: {str(e)}'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, 500

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


