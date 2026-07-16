# utils/file_handler.py - File upload and management utilities
import os
import uuid
from werkzeug.utils import secure_filename
from utils.validators import validate_file_type

UPLOAD_FOLDER = 'uploads'
ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
ALLOWED_DOCUMENT_EXTENSIONS = {'pdf', 'doc', 'docx', 'txt'}
ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'avi', 'mov', 'wmv', 'flv'}

def ensure_upload_folder():
    """Ensure upload folder exists"""
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
    
    # Create subfolders
    subfolders = ['images', 'documents', 'videos', 'bills']
    for folder in subfolders:
        folder_path = os.path.join(UPLOAD_FOLDER, folder)
        if not os.path.exists(folder_path):
            os.makedirs(folder_path)

def get_file_category(filename):
    """Determine file category based on extension"""
    extension = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    
    if extension in ALLOWED_IMAGE_EXTENSIONS:
        return 'images'
    elif extension in ALLOWED_DOCUMENT_EXTENSIONS:
        return 'documents'
    elif extension in ALLOWED_VIDEO_EXTENSIONS:
        return 'videos'
    else:
        return 'documents'  # Default category

def handle_file_upload(file, user_id, upload_type='general'):
    """Handle file upload with validation and storage"""
    try:
        ensure_upload_folder()
        
        if file.filename == '':
            return {'success': False, 'message': 'No file selected'}
        
        # Validate file type
        all_allowed = ALLOWED_IMAGE_EXTENSIONS | ALLOWED_DOCUMENT_EXTENSIONS | ALLOWED_VIDEO_EXTENSIONS
        if not validate_file_type(file.filename, all_allowed):
            return {'success': False, 'message': 'Invalid file type'}
        
        # Generate unique filename
        original_filename = secure_filename(file.filename)
        file_extension = original_filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        
        # Determine storage folder
        if upload_type == 'bills':
            folder = 'bills'
        else:
            folder = get_file_category(original_filename)
        
        file_path = os.path.join(UPLOAD_FOLDER, folder, unique_filename)
        
        # Save file
        file.save(file_path)
        
        return {
            'success': True,
            'filename': unique_filename,
            'original_filename': original_filename,
            'file_path': file_path,
            'file_type': file_extension,
            'file_size': os.path.getsize(file_path)
        }
        
    except Exception as e:
        return {'success': False, 'message': f'File upload failed: {str(e)}'}

def delete_file(file_path):
    """Delete file from filesystem"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False
    except Exception:
        return False