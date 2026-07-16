# blueprints/admin.py - Admin panel endpoints
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.database import User, Reward, Post, Report
from utils.validators import validate_required_fields
from utils.responses import success_response, error_response

admin_bp = Blueprint('admin', __name__)
user_model = User()
reward_model = Reward()
post_model = Post()
report_model = Report()

def is_admin(user):
    """Check if user has admin privileges"""
    return user.get('role') == 'admin'

@admin_bp.route('/rewards', methods=['POST'])
@jwt_required()
def create_reward():
    try:
        current_user_email = get_jwt_identity()
        current_user = user_model.find_one({'email': current_user_email})
        
        if not current_user or not is_admin(current_user):
            return error_response('Admin access required', 403)
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'description', 'points_required', 'task_type']
        validation_error = validate_required_fields(data, required_fields)
        if validation_error:
            return error_response(validation_error, 400)
        
        # Create reward
        reward_data = {
            'title': data['title'],
            'description': data['description'],
            'points_required': int(data['points_required']),
            'badge_name': data.get('badge_name'),
            'task_type': data['task_type'],
            'task_count': data.get('task_count', 1)
        }
        
        reward_id = reward_model.create_reward(reward_data)
        
        return success_response({
            'message': 'Reward created successfully',
            'reward_id': reward_data['reward_id']
        }, 201)
        
    except Exception as e:
        return error_response(f'Failed to create reward: {str(e)}', 500)

@admin_bp.route('/users/<user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    try:
        current_user_email = get_jwt_identity()
        current_user = user_model.find_one({'email': current_user_email})
        
        if not current_user or not is_admin(current_user):
            return error_response('Admin access required', 403)
        
        # Check if user exists
        user_to_delete = user_model.find_one({'user_id': user_id})
        if not user_to_delete:
            return error_response('User not found', 404)
        
        # Prevent deleting other admins
        if is_admin(user_to_delete):
            return error_response('Cannot delete admin users', 403)
        
        # Delete user's content first
        post_model.collection.delete_many({'user_id': user_id})
        report_model.collection.delete_many({'user_id': user_id})
        
        # Delete the user
        result = user_model.delete_one({'user_id': user_id})
        
        if result.deleted_count == 0:
            return error_response('Failed to delete user', 500)
        
        return success_response({'message': 'User deleted successfully'})
        
    except Exception as e:
        return error_response(f'Failed to delete user: {str(e)}', 500)

@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_admin_stats():
    try:
        current_user_email = get_jwt_identity()
        current_user = user_model.find_one({'email': current_user_email})
        
        if not current_user or not is_admin(current_user):
            return error_response('Admin access required', 403)
        
        # Get platform statistics
        total_users = user_model.count_documents({})
        total_posts = post_model.count_documents({})
        total_reports = report_model.count_documents({})
        total_rewards = reward_model.count_documents({})
        
        # Calculate total carbon footprint saved
        users = user_model.find({})
        total_carbon_saved = sum(user.get('carbon_footprint_saved', 0) for user in users)
        
        stats = {
            'total_users': total_users,
            'total_posts': total_posts,
            'total_reports': total_reports,
            'total_rewards': total_rewards,
            'total_carbon_saved': round(total_carbon_saved, 2),
            'average_carbon_per_user': round(total_carbon_saved / total_users if total_users > 0 else 0, 2)
        }
        
        return success_response(stats)
        
    except Exception as e:
        return error_response(f'Failed to get admin stats: {str(e)}', 500)

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():
    try:
        current_user_email = get_jwt_identity()
        current_user = user_model.find_one({'email': current_user_email})
        
        if not current_user or not is_admin(current_user):
            return error_response('Admin access required', 403)
        
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        skip = (page - 1) * limit
        
        users = user_model.find(
            sort=[('created_at', -1)],
            limit=limit,
            skip=skip
        )
        
        user_list = []
        for user in users:
            user_data = {
                'user_id': user['user_id'],
                'name': user['name'],
                'email': user['email'],
                'points': user.get('points', 0),
                'level': user.get('level', 1),
                'carbon_saved': user.get('carbon_footprint_saved', 0),
                'created_at': user['created_at'].isoformat(),
                'role': user.get('role', 'user')
            }
            user_list.append(user_data)
        
        return success_response({
            'users': user_list,
            'page': page,
            'limit': limit,
            'total': len(user_list)
        })
        
    except Exception as e:
        return error_response(f'Failed to get users: {str(e)}', 500)