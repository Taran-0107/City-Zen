# utils/validators.py - Input validation utilities
import re

def validate_required_fields(data, required_fields):
    """Validate that all required fields are present and not empty"""
    if not data:
        return "Request body is required"
    
    missing_fields = []
    for field in required_fields:
        if field not in data or not data[field] or (isinstance(data[field], str) and data[field].strip() == ""):
            missing_fields.append(field)
    
    if missing_fields:
        return f"Missing required fields: {', '.join(missing_fields)}"
    
    return None

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Validate password strength"""
    if len(password) < 8:
        return {
            'valid': False,
            'message': 'Password must be at least 8 characters long'
        }
    
    if not re.search(r'[A-Za-z]', password):
        return {
            'valid': False,
            'message': 'Password must contain at least one letter'
        }
    
    if not re.search(r'\d', password):
        return {
            'valid': False,
            'message': 'Password must contain at least one number'
        }
    
    return {'valid': True, 'message': 'Password is valid'}

def validate_file_type(filename, allowed_types):
    """Validate file type based on extension"""
    if '.' not in filename:
        return False
    
    extension = filename.rsplit('.', 1)[1].lower()
    return extension in allowed_types