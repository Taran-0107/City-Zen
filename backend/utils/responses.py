# utils/responses.py - Standard API response utilities
from flask import jsonify

def success_response(data=None, status_code=200):
    """Create standardized success response"""
    response = {
        'success': True,
        'status': status_code
    }
    
    if data:
        if isinstance(data, dict):
            response.update(data)
        else:
            response['data'] = data
    
    return jsonify(response), status_code

def error_response(message, status_code=400, error_code=None):
    """Create standardized error response"""
    response = {
        'success': False,
        'error': message,
        'status': status_code
    }
    
    if error_code:
        response['error_code'] = error_code
    
    return jsonify(response), status_code