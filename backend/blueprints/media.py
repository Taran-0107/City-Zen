# blueprints/media.py - Media handling endpoints
import os
from flask import Blueprint, request, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from bson.errors import InvalidId
from models.database import User, Picture
from utils.responses import success_response, error_response
from utils.file_handler import handle_file_upload

media_bp = Blueprint('media', __name__)
user_model = User()
picture_model = Picture()

@media_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_media():
    try:
        current_user_email = get_jwt_identity()
        current_user = user_model.find_one({'email': current_user_email})

        if not current_user:
            return error_response('User not found', 404)

        if 'file' not in request.files:
            return error_response('No file part in the request', 400)

        file = request.files['file']
        if file.filename == '':
            return error_response('No file selected for uploading', 400)

        upload_result = handle_file_upload(file, current_user['user_id'])

        if not upload_result['success']:
            return error_response(upload_result['message'], 500)

        # Store file info in the database
        picture_id = picture_model.store_file_info({
            'filename': upload_result['filename'],
            'file_type': upload_result['file_type'],
            'file_path': upload_result['file_path'],
            'user_id': current_user['user_id']
        })
        
        # --- MODIFIED: Only update profile picture if specified ---
        upload_type = request.form.get('upload_type')
        if upload_type == 'profile':
            user_model.update_one(
                {'user_id': current_user['user_id']},
                {'$set': {'profile_picture_id': str(picture_id)}}
            )
        # ---------------------------------------------------------

        return success_response({
            'message': 'File uploaded successfully',
            'picture_id': str(picture_id),
            'filename': upload_result['filename']
        }, 201)

    except Exception as e:
        return error_response(f'File upload failed: {str(e)}', 500)

@media_bp.route('/view/<picture_id>')
def view_media(picture_id):
    try:
        obj_id = ObjectId(picture_id)
        picture_info = picture_model.find_one({'_id': obj_id})

        if not picture_info:
            return error_response('File not found in database', 404)
        
        file_path = picture_info.get('file_path')
        if not file_path or not os.path.exists(file_path):
             return error_response('File not found on server disk', 404)

        directory, filename = os.path.split(file_path)
        abs_directory = os.path.abspath(directory)
        
        return send_from_directory(abs_directory, filename)

    except InvalidId:
        return error_response('Invalid file ID format', 400)
    except Exception as e:
        return error_response(f'Could not serve file: {str(e)}', 500)