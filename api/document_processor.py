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

