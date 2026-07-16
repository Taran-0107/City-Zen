# blueprints/leaderboard.py - Leaderboard endpoints
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.database import User
from utils.responses import success_response, error_response

leaderboard_bp = Blueprint('leaderboard', __name__)
user_model = User()

@leaderboard_bp.route('/global', methods=['GET'])
@jwt_required()
def get_global_leaderboard():
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        sort_by = request.args.get('sort', 'points')  # points, carbon_saved, level
        
        skip = (page - 1) * limit
        
        # Determine sort criteria
        if sort_by == 'carbon_saved':
            sort_criteria = [('carbon_footprint_saved', -1), ('points', -1)]
        elif sort_by == 'level':
            sort_criteria = [('level', -1), ('points', -1)]
        else:  # points
            sort_criteria = [('points', -1), ('level', -1)]
        
        # Get top users
        users = user_model.find(
            sort=sort_criteria,
            limit=limit,
            skip=skip
        )
        
        # Format leaderboard
        leaderboard = []
        for i, user in enumerate(users, start=skip + 1):
            user_data = {
                'rank': i,
                'user_id': user['user_id'],
                'name': user['name'],
                'points': user.get('points', 0),
                'level': user.get('level', 1),
                'carbon_saved': user.get('carbon_footprint_saved', 0),
                'badges_count': len(user.get('badges', []))
            }
            leaderboard.append(user_data)
        
        return success_response({
            'leaderboard': leaderboard,
            'page': page,
            'limit': limit,
            'sort_by': sort_by
        })
        
    except Exception as e:
        return error_response(f'Failed to get global leaderboard: {str(e)}', 500)

@leaderboard_bp.route('/friends/<user_id>', methods=['GET'])
@jwt_required()
def get_friends_leaderboard(user_id):
    try:
        current_user_email = get_jwt_identity()
        current_user = user_model.find_one({'email': current_user_email})
        
        if not current_user:
            return error_response('User not found', 404)
        
        # Get user's following list
        user = user_model.find_one({'user_id': user_id})
        if not user:
            return error_response('User not found', 404)
        
        following_ids = user.get('following', [])
        following_ids.append(user_id)  # Include the user themselves
        
        # Get friends' data
        friends = user_model.find(
            {'user_id': {'$in': following_ids}},
            sort=[('points', -1)]
        )
        
        # Format friends leaderboard
        leaderboard = []
        for i, friend in enumerate(friends, 1):
            friend_data = {
                'rank': i,
                'user_id': friend['user_id'],
                'name': friend['name'],
                'points': friend.get('points', 0),
                'level': friend.get('level', 1),
                'carbon_saved': friend.get('carbon_footprint_saved', 0),
                'is_current_user': friend['user_id'] == user_id
            }
            leaderboard.append(friend_data)
        
        return success_response({
            'leaderboard': leaderboard,
            'total_friends': len(leaderboard) - 1  # Exclude current user from count
        })
        
    except Exception as e:
        return error_response(f'Failed to get friends leaderboard: {str(e)}', 500)