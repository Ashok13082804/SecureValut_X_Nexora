import io
import pypdf
import docx

class DocumentParser:
    @staticmethod
    def extract_text(filename: str, content: bytes) -> str:
        """Safely extract plain text from supported document formats without execution."""
        ext = filename.split('.')[-1].lower() if '.' in filename else ''
        extracted_text = ""
        
        try:
            if ext == 'pdf':
                reader = pypdf.PdfReader(io.BytesIO(content))
                text_pieces = []
                for page in reader.pages[:20]:  # Read up to first 20 pages
                    text = page.extract_text()
                    if text:
                        text_pieces.append(text)
                extracted_text = "\n".join(text_pieces)
                
            elif ext in ['docx', 'doc']:
                doc = docx.Document(io.BytesIO(content))
                paragraphs = [p.text for p in doc.paragraphs if p.text]
                extracted_text = "\n".join(paragraphs)
                
            elif ext in ['txt', 'csv', 'json', 'xml', 'log', 'md']:
                try:
                    extracted_text = content.decode('utf-8', errors='ignore')
                except Exception:
                    extracted_text = content.decode('latin-1', errors='ignore')
                    
            else:
                # For binaries or images, attempt ASCII string extraction
                extracted_text = content[:4096].decode('ascii', errors='ignore')
        except Exception:
            extracted_text = ""
            
        return extracted_text

document_parser = DocumentParser()
