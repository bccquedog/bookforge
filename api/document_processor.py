"""
Document Processing Utilities
Handles extraction of content from various document formats
"""

import logging
from pathlib import Path
from typing import Optional
import re

logger = logging.getLogger(__name__)

try:
    import mammoth
    MAMMOTH_AVAILABLE = True
except ImportError:
    MAMMOTH_AVAILABLE = False
    logger.warning("Mammoth not available. DOCX extraction will be limited.")

try:
    from striprtf.striprtf import rtf_to_text
    RTF_AVAILABLE = True
except ImportError:
    RTF_AVAILABLE = False
    logger.warning("striprtf not available. RTF extraction will be limited.")

try:
    import odf.odf
    ODF_AVAILABLE = True
except ImportError:
    ODF_AVAILABLE = False
    logger.warning("odfpy not available. ODT extraction will be limited.")

try:
    import markdown
    MARKDOWN_AVAILABLE = True
except ImportError:
    MARKDOWN_AVAILABLE = False

try:
    from bs4 import BeautifulSoup
    BS4_AVAILABLE = True
except ImportError:
    BS4_AVAILABLE = False


def extract_text_from_file(file_path: Path) -> Optional[str]:
    """
    Extract plain text from various document formats
    
    Args:
        file_path: Path to the document file
        
    Returns:
        Extracted text content or None if extraction fails
    """
    file_ext = file_path.suffix.lower()
    
    try:
        if file_ext == '.txt':
            return _extract_txt(file_path)
        elif file_ext == '.md':
            return _extract_markdown(file_path)
        elif file_ext in ['.html', '.htm']:
            return _extract_html(file_path)
        elif file_ext == '.docx':
            return _extract_docx(file_path)
        elif file_ext == '.doc':
            return _extract_doc(file_path)
        elif file_ext == '.odt':
            return _extract_odt(file_path)
        elif file_ext == '.rtf':
            return _extract_rtf(file_path)
        else:
            logger.warning(f"Unsupported file format: {file_ext}")
            return None
            
    except Exception as e:
        logger.error(f"Error extracting text from {file_path}: {e}")
        return None


def extract_html_from_file(file_path: Path) -> Optional[dict]:
    """
    Extract HTML content with embedded images from document files
    
    Args:
        file_path: Path to the document file
        
    Returns:
        Dictionary with 'html' (HTML content) and 'format' ('html' or 'text') 
        or None if extraction fails
    """
    file_ext = file_path.suffix.lower()
    
    try:
        if file_ext == '.docx':
            return _extract_docx_html(file_path)
        elif file_ext in ['.html', '.htm']:
            html_content = _extract_html_raw(file_path)
            return {'html': html_content, 'format': 'html'} if html_content else None
        elif file_ext == '.md':
            html_content = _extract_markdown_html(file_path)
            return {'html': html_content, 'format': 'html'} if html_content else None
        else:
            # For other formats, return text wrapped in HTML
            text_content = extract_text_from_file(file_path)
            if text_content:
                # Escape HTML and wrap in <pre> tag to preserve formatting
                import html
                escaped_text = html.escape(text_content)
                return {'html': f'<pre style="white-space: pre-wrap; font-family: inherit;">{escaped_text}</pre>', 'format': 'text'}
            return None
            
    except Exception as e:
        logger.error(f"Error extracting HTML from {file_path}: {e}")
        return None


def _extract_txt(file_path: Path) -> str:
    """Extract text from plain text file"""
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        return f.read()


def _extract_markdown(file_path: Path) -> str:
    """Extract text from Markdown file"""
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
        
    if MARKDOWN_AVAILABLE:
        # Convert markdown to HTML then extract text
        html = markdown.markdown(content)
        if BS4_AVAILABLE:
            soup = BeautifulSoup(html, 'html.parser')
            return soup.get_text()
    
    return content


def _extract_html(file_path: Path) -> str:
    """Extract text from HTML file"""
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        html_content = f.read()
    
    if BS4_AVAILABLE:
        soup = BeautifulSoup(html_content, 'html.parser')
        # Remove script and style elements
        for script in soup(['script', 'style']):
            script.decompose()
        return soup.get_text(separator='\n', strip=True)
    
    # Fallback: simple regex extraction
    text = re.sub(r'<[^>]+>', '', html_content)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def _extract_docx(file_path: Path) -> str:
    """Extract text from DOCX file"""
    if MAMMOTH_AVAILABLE:
        try:
            with open(file_path, 'rb') as f:
                result = mammoth.extract_raw_text(f)
                return result.value
        except Exception as e:
            logger.error(f"Error using mammoth: {e}")
            return _extract_docx_fallback(file_path)
    else:
        return _extract_docx_fallback(file_path)


def _extract_docx_html(file_path: Path) -> Optional[dict]:
    """Extract HTML with embedded images from DOCX file"""
    if MAMMOTH_AVAILABLE:
        try:
            def convert_image(image):
                """Convert images to base64 data URLs"""
                with image.open() as image_bytes:
                    import base64
                    encoded_src = base64.b64encode(image_bytes.read()).decode("ascii")
                    return {"src": f"data:{image.content_type};base64,{encoded_src}"}
            
            with open(file_path, 'rb') as f:
                result = mammoth.convert_to_html(f, convert_image=mammoth.images.img_element(convert_image))
                html_content = result.value
                
                # Log any conversion messages
                if result.messages:
                    for message in result.messages:
                        logger.info(f"Mammoth conversion message: {message}")
                
                # Post-process HTML to detect and format chapter headings
                html_content = _detect_chapters_in_html(html_content)
                
                return {'html': html_content, 'format': 'html'}
        except Exception as e:
            logger.error(f"Error using mammoth to extract HTML: {e}")
            # Fallback to text extraction
            text = _extract_docx_fallback(file_path)
            if text:
                import html
                escaped_text = html.escape(text)
                return {'html': f'<pre style="white-space: pre-wrap; font-family: inherit;">{escaped_text}</pre>', 'format': 'text'}
            return None
    else:
        # Fallback to text extraction
        text = _extract_docx_fallback(file_path)
        if text:
            import html
            escaped_text = html.escape(text)
            return {'html': f'<pre style="white-space: pre-wrap; font-family: inherit;">{escaped_text}</pre>', 'format': 'text'}
        return None


def _extract_html_raw(file_path: Path) -> Optional[str]:
    """Extract raw HTML content from HTML file"""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read()
    except Exception as e:
        logger.error(f"Error reading HTML file: {e}")
        return None


def _extract_markdown_html(file_path: Path) -> Optional[str]:
    """Extract HTML from Markdown file"""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        if MARKDOWN_AVAILABLE:
            return markdown.markdown(content)
        else:
            # Simple fallback: wrap in <pre>
            import html
            escaped = html.escape(content)
            return f'<pre style="white-space: pre-wrap;">{escaped}</pre>'
    except Exception as e:
        logger.error(f"Error converting markdown to HTML: {e}")
        return None


def _extract_docx_fallback(file_path: Path) -> str:
    """Fallback DOCX extraction using python-docx"""
    try:
        from docx import Document
        doc = Document(file_path)
        paragraphs = [p.text for p in doc.paragraphs]
        return '\n\n'.join(paragraphs)
    except Exception as e:
        logger.error(f"Fallback DOCX extraction failed: {e}")
        return "[DOCX file could not be fully parsed]"


def _extract_doc(file_path: Path) -> str:
    """Extract text from legacy DOC file"""
    # DOC files are binary format - this is a placeholder
    # For production, you'd need antiword or LibreOffice
    return f"[Legacy .doc file - conversion to text not fully supported: {file_path.name}]"


def _extract_odt(file_path: Path) -> str:
    """Extract text from ODT file"""
    try:
        from odf.opendocument import load
        from odf.text import P
        
        doc = load(file_path)
        text_content = []
        
        for paragraph in doc.getElementsByType(P):
            text_content.append(paragraph.astext())
        
        return '\n\n'.join(text_content)
    except Exception as e:
        logger.error(f"Error extracting ODT: {e}")
        return f"[ODT file could not be parsed: {file_path.name}]"


def _extract_rtf(file_path: Path) -> str:
    """Extract text from RTF file"""
    if RTF_AVAILABLE:
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                rtf_content = f.read()
            return rtf_to_text(rtf_content)
        except Exception as e:
            logger.error(f"Error extracting RTF: {e}")
            return f"[RTF file could not be parsed: {file_path.name}]"
    else:
        # Simple fallback: strip RTF codes
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        # Remove RTF control words
        text = re.sub(r'\\[a-z]+\d*\s?', '', content)
        # Remove braces
        text = re.sub(r'[{}]', '', text)
        # Clean up whitespace
        text = re.sub(r'\s+', ' ', text)
        return text.strip()


def _detect_chapters_in_html(html: str) -> str:
    """
    Post-process HTML to detect chapter headings and convert them to proper h1 headings.
    This handles cases where chapter titles are in paragraphs instead of heading tags.
    """
    try:
        from bs4 import BeautifulSoup
        
        if not BS4_AVAILABLE:
            return html
        
        soup = BeautifulSoup(html, 'html.parser')
        chapter_count = 0
        
        # Find all paragraphs
        paragraphs = soup.find_all('p')
        
        for p in paragraphs:
            text_content = p.get_text(strip=True)
            
            # Check if this paragraph looks like a chapter heading
            if _is_chapter_heading(text_content):
                # Create a new section and h1 heading
                chapter_count += 1
                heading_id = f"chapter-{chapter_count}"
                
                # Create section wrapper
                section = soup.new_tag('section', class_='chapter', id=heading_id)
                
                # Create h1 heading
                h1 = soup.new_tag('h1', class_='chapter-title')
                h1.string = text_content
                
                # Replace paragraph with section containing h1
                section.append(h1)
                p.replace_with(section)
                
                logger.info(f"Detected chapter heading: {text_content[:50]}...")
        
        return str(soup)
        
    except Exception as e:
        logger.warning(f"Error detecting chapters in HTML: {e}")
        return html


def _is_chapter_heading(text: str) -> bool:
    """
    Check if a text string looks like a chapter heading.
    Uses similar logic to detect_chapter_heading but works on plain text.
    """
    if not text or len(text) > 200:  # Headings should be short
        return False
    
    text_upper = text.upper().strip()
    
    # Common chapter patterns
    patterns = [
        r'^CHAPTER\s+[A-Z]+[\w\s-]*:?',  # "CHAPTER ONE", "CHAPTER TWENTY-ONE:"
        r'^CHAPTER\s+\d+',  # "CHAPTER 1", "CHAPTER 21"
        r'^CHAPTER\s+[A-Z]+[\w\s-]*:.*',  # "CHAPTER ONE: The Invitation"
        r'^CHAPTER\s+\d+:.*',  # "CHAPTER 1: Title"
        r'^PART\s+[IVX]+',  # "PART I", "PART II"
        r'^PART\s+\d+',  # "PART 1", "PART 2"
        r'^PROLOGUE',
        r'^EPILOGUE',
    ]
    
    for pattern in patterns:
        if re.match(pattern, text_upper):
            return True
    
    # Also check for "Chapter" followed by number word or number
    if re.match(r'^CHAPTER\s+[A-Z]+[\w\s-]*:?', text_upper):
        return True
    
    return False

