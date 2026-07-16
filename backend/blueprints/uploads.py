# blueprints/uploads.py - File serving and uploading endpoints
import os
from flask import Blueprint, request, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.database import User, Picture
from utils.responses import success_response, error_response
from utils.file_handler import handle_file_upload

uploads_bp = Blueprint('uploads', __name__)
user_model = User()
picture_model = Picture()

@uploads_bp.route('/image', methods=['POST'])
@jwt_required()
def upload_image():
    try:
        current_user_email = get_jwt_identity()
        current_user = user_model.find_one({'email': current_user_email})
        
        if not current_user:
            return error_response('User not found', 404)
        
        if 'file' not in request.files:
            return error_response('No file uploaded', 400)
        
        file = request.files['file']
        if file.filename == '':
            return error_response('No file selected', 400)
        
        # Use the general purpose file handler, specifying 'images' type
        file_info = handle_file_upload(file, current_user['user_id'], 'images')
        
        if not file_info['success']:
            return error_response(file_info['message'], 400)
        
        # Store file information
        picture_id = picture_model.store_file_info({
            'filename': file_info['filename'],
            'file_type': file_info['file_type'],
            'file_path': file_info['file_path'],
            'user_id': current_user['user_id']
        })
        
        return success_response({
            'message': 'Image uploaded successfully',
            'picture_id': picture_id,
            'file_path': file_info['file_path']
        }, 201)
        
    except Exception as e:
        return error_response(f'Failed to upload image: {str(e)}', 500)

@uploads_bp.route('/<path:filepath>')
def serve_upload(filepath):
    # This is a simplified serve endpoint. In production, you'd likely
    # use a more robust solution like Nginx to serve static files.
    # The UPLOAD_FOLDER is relative to the app's root.
    return send_from_directory(os.path.join('..', 'uploads'), filepath)