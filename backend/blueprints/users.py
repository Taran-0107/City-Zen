# blueprints/users.py - User management endpoints
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.database import User, Notification
from utils.validators import validate_required_fields
from utils.responses import success_response, error_response
from utils.file_handler import handle_file_upload

users_bp = Blueprint('users', __name__)
user_model = User()
notification_model = Notification()

@users_bp.route('/<user_id>', methods=['GET'])
@jwt_required()
def get_user_profile(user_id):
    try:
        user = user_model.find_one({'user_id': user_id})
        
        if not user:
            return error_response('User not found', 404)
        
        # Public user information
        user_data = {
            'user_id': user['user_id'],
            'name': user['name'],
            'points': user['points'],
            'level': user['level'],
            'badges': user.get('badges', []),
            'carbon_footprint_saved': user.get('carbon_footprint_saved', 0),
            'profile_picture_id': user.get('profile_picture_id'),
            'followers_count': len(user.get('followers', [])),
            'following_count': len(user.get('following', []))
        }
        
        # Check if current user is following this user
        current_user_email = get_jwt_identity()
        current_user = user_model.find_one({'email': current_user_email})
        
        if current_user:
            user_data['is_following'] = user_id in current_user.get('following', [])
        
        return success_response(user_data)
        
    except Exception as e:
        return error_response(f'Failed to get user profile: {str(e)}', 500)

@users_bp.route('/<user_id>', methods=['PUT'])
@jwt_required()
def update_user_profile(user_id):
    try:
        current_user_email = get_jwt_identity()
        current_user = user_model.find_one({'email': current_user_email})
        
        if not current_user or current_user['user_id'] != user_id:
            return error_response('Unauthorized to update this profile', 403)
        
        data = request.get_json()
        
        # Allowed fields for update
        allowed_fields = ['name', 'profile_picture_id']
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        
        if not update_data:
            return error_response('No valid fields to update', 400)
        
        # Update user
        result = user_model.update_one(
            {'user_id': user_id},
            {'$set': update_data}
        )
        
        if result.modified_count == 0:
            return error_response('No changes made', 400)
        
        return success_response({'message': 'Profile updated successfully'})
        
    except Exception as e:
        return error_response(f'Failed to update profile: {str(e)}', 500)

@users_bp.route('/<user_id>/follow', methods=['POST'])
@jwt_required()
def follow_user(user_id):
    try:
        current_user_email = get_jwt_identity()
        current_user = user_model.find_one({'email': current_user_email})
        
        if not current_user:
            return error_response('Current user not found', 404)
        
        if current_user['user_id'] == user_id:
            return error_response('Cannot follow yourself', 400)
        
        # Check if target user exists
        target_user = user_model.find_one({'user_id': user_id})
        if not target_user:
            return error_response('User to follow not found', 404)
        
        current_following = current_user.get('following', [])
        target_followers = target_user.get('followers', [])
        
        if user_id in current_following:
            # Unfollow
            user_model.update_one(
                {'user_id': current_user['user_id']},
                {'$pull': {'following': user_id}}
            )
            user_model.update_one(
                {'user_id': user_id},
                {'$pull': {'followers': current_user['user_id']}}
            )
            message = 'User unfollowed successfully'
        else:
            # Follow
            user_model.update_one(
                {'user_id': current_user['user_id']},
                {'$push': {'following': user_id}}
            )
            user_model.update_one(
                {'user_id': user_id},
                {'$push': {'followers': current_user['user_id']}}
            )
            
            # Create notification for followed user
            notification_model.create_notification({
                'user_id': user_id,
                'title': 'New Follower',
                'message': f'{current_user["name"]} started following you',
                'type': 'follow',
                'data': {'follower_id': current_user['user_id']}
            })
            
            message = 'User followed successfully'
        
        return success_response({'message': message})
        
    except Exception as e:
        return error_response(f'Failed to follow/unfollow user: {str(e)}', 500)

@users_bp.route('/<user_id>/followers', methods=['GET'])
@jwt_required()
def get_user_followers(user_id):
    try:
        user = user_model.find_one({'user_id': user_id})
        
        if not user:
            return error_response('User not found', 404)
        
        follower_ids = user.get('followers', [])
        
        # Get follower details
        followers = []
        for follower_id in follower_ids:
            follower = user_model.find_one({'user_id': follower_id})
            if follower:
                followers.append({
                    'user_id': follower['user_id'],
                    'name': follower['name'],
                    'level': follower['level'],
                    'profile_picture_id': follower.get('profile_picture_id')
                })
        
        return success_response({
            'followers': followers,
            'count': len(followers)
        })
        
    except Exception as e:
        return error_response(f'Failed to get followers: {str(e)}', 500)

@users_bp.route('/<user_id>/following', methods=['GET'])
@jwt_required()
def get_user_following(user_id):
    try:
        user = user_model.find_one({'user_id': user_id})
        
        if not user:
            return error_response('User not found', 404)
        
        following_ids = user.get('following', [])
        
        # Get following details
        following = []
        for following_id in following_ids:
            followed_user = user_model.find_one({'user_id': following_id})
            if followed_user:
                following.append({
                    'user_id': followed_user['user_id'],
                    'name': followed_user['name'],
                    'level': followed_user['level'],
                    'profile_picture_id': followed_user.get('profile_picture_id')
                })
        
        return success_response({
            'following': following,
            'count': len(following)
        })
        
    except Exception as e:
        return error_response(f'Failed to get following: {str(e)}', 500)

@users_bp.route('/search', methods=['GET'])
@jwt_required()
def search_users():
    try:
        query = request.args.get('q', '').strip()
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        skip = (page - 1) * limit
        
        if not query:
            return error_response('Search query is required', 400)
        
        # Search users by name (case-insensitive)
        users = user_model.find(
            {'name': {'$regex': query, '$options': 'i'}},
            limit=limit,
            skip=skip,
            sort=[('points', -1)]  # Sort by points descending
        )
        
        # Format user data
        user_list = []
        for user in users:
            user_list.append({
                'user_id': user['user_id'],
                'name': user['name'],
                'level': user['level'],
                'points': user['points'],
                'profile_picture_id': user.get('profile_picture_id')
            })
        
        return success_response({
            'users': user_list,
            'page': page,
            'limit': limit,
            'total': len(user_list)
        })
        
    except Exception as e:
        return error_response(f'Failed to search users: {str(e)}', 500)