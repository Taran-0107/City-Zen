# blueprints/auth.py - Authentication endpoints
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models.database import User,Picture
from utils.validators import validate_email, validate_password, validate_required_fields
from utils.responses import success_response, error_response

auth_bp = Blueprint('auth', __name__)
user_model = User()
picture_model = Picture()

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'email', 'password']
        validation_error = validate_required_fields(data, required_fields)
        if validation_error:
            return error_response(validation_error, 400)
        
        # Validate email format
        if not validate_email(data['email']):
            return error_response('Invalid email format', 400)
        
        # Validate password strength
        password_validation = validate_password(data['password'])
        if not password_validation['valid']:
            return error_response(password_validation['message'], 400)
        
        # Check if user already exists
        existing_user = user_model.find_one({'email': data['email'].lower()})
        if existing_user:
            return error_response('User already exists with this email', 409)
        
        # Create new user
        user_id = user_model.create_user(data)
        
        # Generate JWT token
        access_token = create_access_token(identity=data['email'].lower())
        
        return success_response({
            'message': 'User registered successfully',
            'access_token': access_token,
            'user': {
                'name': data['name'],
                'email': data['email'].lower(),
                'points': 0,
                'level': 1
            }
        }, 201)
        
    except Exception as e:
        return error_response(f'Registration failed: {str(e)}', 500)

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password']
        validation_error = validate_required_fields(data, required_fields)
        if validation_error:
            return error_response(validation_error, 400)
        
        # Verify user credentials
        user = user_model.verify_password(data['email'], data['password'])
        if not user:
            return error_response('Invalid email or password', 401)
        
        # Generate JWT token
        access_token = create_access_token(identity=user['email'])
        
        return success_response({
            'message': 'Login successful',
            'access_token': access_token,
            'user': {
                'user_id': user['user_id'],
                'name': user['name'],
                'email': user['email'],
                'points': user['points'],
                'level': user['level'],
                'badges': user.get('badges', []),
                'carbon_footprint_saved': user.get('carbon_footprint_saved', 0)
            }
        })
        
    except Exception as e:
        return error_response(f'Login failed: {str(e)}', 500)


@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    try:
        current_user_email = get_jwt_identity()
        user = user_model.find_one({'email': current_user_email})
        
        if not user:
            return error_response('User not found', 404)
        
        # Get profile picture URL
        profile_picture_url = None
        if user.get('profile_picture_id'):
            picture = picture_model.find_one({'picture_id': user['profile_picture_id']})
            if picture:
                # Construct full URL
                profile_picture_url = f"{request.host_url}uploads/{picture['file_path'].replace('uploads/', '', 1)}"

        # Remove sensitive information
        user_data = {
            'user_id': user['user_id'],
            'name': user['name'],
            'email': user['email'],
            'points': user['points'],
            'level': user['level'],
            'badges': user.get('badges', []),
            'carbon_footprint_saved': user.get('carbon_footprint_saved', 0),
            'profile_picture_id': user.get('profile_picture_id'),
            'profile_picture_url': profile_picture_url, # Add URL to response
            'followers_count': len(user.get('followers', [])),
            'following_count': len(user.get('following', []))
        }
        
        return success_response(user_data)
        
    except Exception as e:
        return error_response(f'Failed to get profile: {str(e)}', 500)
@auth_bp.route('/refresh', methods=['POST'])
@jwt_required()
def refresh_token():
    try:
        current_user_email = get_jwt_identity()
        new_token = create_access_token(identity=current_user_email)
        
        return success_response({
            'access_token': new_token,
            'message': 'Token refreshed successfully'
        })
        
    except Exception as e:
        return error_response(f'Token refresh failed: {str(e)}', 500)