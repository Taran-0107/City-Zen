# blueprints/rewards.py - Gamification and rewards endpoints
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.database import Reward, User, Notification
from utils.responses import success_response, error_response

rewards_bp = Blueprint('rewards', __name__)
reward_model = Reward()
user_model = User()
notification_model = Notification()

@rewards_bp.route('', methods=['GET'])
@jwt_required()
def get_rewards():
    try:
        current_user_email = get_jwt_identity()
        current_user = user_model.find_one({'email': current_user_email})
        
        if not current_user:
            return error_response('User not found', 404)
        
        # Get all available rewards
        rewards = reward_model.find(sort=[('points_required', 1)])  # Sort by points required
        
        # Format rewards with user's eligibility status
        reward_list = []
        user_points = current_user.get('points', 0)
        user_badges = current_user.get('badges', [])
        
        for reward in rewards:
            reward_data = {
                'reward_id': reward['reward_id'],
                'title': reward['title'],
                'description': reward['description'],
                'points_required': reward['points_required'],
                'badge_name': reward.get('badge_name'),
                'task_type': reward['task_type'],
                'task_count': reward.get('task_count', 1),
                'eligible': user_points >= reward['points_required'],
                'already_claimed': reward.get('badge_name') in user_badges if reward.get('badge_name') else False
            }
            reward_list.append(reward_data)
        
        return success_response({
            'rewards': reward_list,
            'user_points': user_points,
            'total_rewards': len(reward_list)
        })
        
    except Exception as e:
        return error_response(f'Failed to get rewards: {str(e)}', 500)

@rewards_bp.route('/claim/<reward_id>', methods=['POST'])
@jwt_required()
def claim_reward(reward_id):
    try:
        current_user_email = get_jwt_identity()
        current_user = user_model.find_one({'email': current_user_email})
        
        if not current_user:
            return error_response('User not found', 404)
        
        # Get reward details
        reward = reward_model.find_one({'reward_id': reward_id})
        if not reward:
            return error_response('Reward not found', 404)
        
        # Check if user has enough points
        user_points = current_user.get('points', 0)
        if user_points < reward['points_required']:
            return error_response(f'Insufficient points. Need {reward["points_required"]}, have {user_points}', 400)
        
        # Check if user already claimed this badge
        user_badges = current_user.get('badges', [])
        if reward.get('badge_name') and reward['badge_name'] in user_badges:
            return error_response('Reward already claimed', 400)
        
        # Verify task completion based on task type
        task_completed = verify_task_completion(current_user['user_id'], reward)
        if not task_completed:
            return error_response(f'Task not completed. Required: {reward["description"]}', 400)
        
        # Deduct points and award badge
        new_points = user_points - reward['points_required']
        update_data = {'points': new_points}
        
        if reward.get('badge_name'):
            user_badges.append(reward['badge_name'])
            update_data['badges'] = user_badges
        
        # Update user
        user_model.update_one(
            {'user_id': current_user['user_id']},
            {'$set': update_data}
        )
        
        # Create achievement notification
        notification_model.create_notification({
            'user_id': current_user['user_id'],
            'title': 'Reward Claimed!',
            'message': f'You claimed the "{reward["title"]}" reward!',
            'type': 'reward',
            'data': {'reward_id': reward_id, 'badge_name': reward.get('badge_name')}
        })
        
        return success_response({
            'message': 'Reward claimed successfully',
            'reward_title': reward['title'],
            'badge_earned': reward.get('badge_name'),
            'points_spent': reward['points_required'],
            'remaining_points': new_points
        })
        
    except Exception as e:
        return error_response(f'Failed to claim reward: {str(e)}', 500)

def verify_task_completion(user_id, reward):
    """Verify if user has completed the required task for the reward"""
    task_type = reward['task_type']
    task_count = reward.get('task_count', 1)
    
    try:
        if task_type == 'posts_created':
            from models.database import Post
            post_model = Post()
            posts_count = post_model.count_documents({'user_id': user_id})
            return posts_count >= task_count
            
        elif task_type == 'reports_created':
            from models.database import Report
            report_model = Report()
            reports_count = report_model.count_documents({'user_id': user_id})
            return reports_count >= task_count
            
        elif task_type == 'bills_uploaded':
            from models.database import Bill
            bill_model = Bill()
            bills_count = bill_model.count_documents({'user_id': user_id})
            return bills_count >= task_count
            
        elif task_type == 'carbon_saved':
            # Check if user has saved required amount of carbon footprint
            user = user_model.find_one({'user_id': user_id})
            carbon_saved = user.get('carbon_footprint_saved', 0)
            return carbon_saved >= task_count
            
        elif task_type == 'likes_received':
            # Count total likes received on posts and reports
            from models.database import Post, Report
            post_model = Post()
            report_model = Report()
            
            posts = post_model.find({'user_id': user_id})
            reports = report_model.find({'user_id': user_id})
            
            total_likes = sum(post.get('likes_count', 0) for post in posts)
            total_likes += sum(report.get('likes_count', 0) for report in reports)
            
            return total_likes >= task_count
            
        elif task_type == 'level_reached':
            user = user_model.find_one({'user_id': user_id})
            return user.get('level', 1) >= task_count
            
        else:
            # For unknown task types, return True (manual verification)
            return True
            
    except Exception as e:
        print(f"Error verifying task completion: {str(e)}")
        return False

@rewards_bp.route('/progress/<user_id>', methods=['GET'])
@jwt_required()
def get_reward_progress(user_id):
    try:
        current_user_email = get_jwt_identity()
        current_user = user_model.find_one({'email': current_user_email})
        
        if not current_user:
            return error_response('User not found', 404)
        
        # Check if user can access this progress
        if current_user['user_id'] != user_id:
            return error_response('Unauthorized to access this progress', 403)
        
        # Get user statistics for progress calculation
        from models.database import Post, Report, Bill
        
        post_model = Post()
        report_model = Report()
        bill_model = Bill()
        
        # Count user activities
        posts_count = post_model.count_documents({'user_id': user_id})
        reports_count = report_model.count_documents({'user_id': user_id})
        bills_count = bill_model.count_documents({'user_id': user_id})
        
        # Calculate total likes received
        posts = post_model.find({'user_id': user_id})
        reports = report_model.find({'user_id': user_id})
        
        total_likes = sum(post.get('likes_count', 0) for post in posts)
        total_likes += sum(report.get('likes_count', 0) for report in reports)
        
        user = user_model.find_one({'user_id': user_id})
        
        progress_data = {
            'user_id': user_id,
            'current_level': user.get('level', 1),
            'current_points': user.get('points', 0),
            'carbon_footprint_saved': user.get('carbon_footprint_saved', 0),
            'activities': {
                'posts_created': posts_count,
                'reports_created': reports_count,
                'bills_uploaded': bills_count,
                'likes_received': total_likes
            },
            'badges_earned': user.get('badges', []),
            'badges_count': len(user.get('badges', []))
        }
        
        return success_response(progress_data)
        
    except Exception as e:
        return error_response(f'Failed to get reward progress: {str(e)}', 500)

@rewards_bp.route('/leaderboard', methods=['GET'])
@jwt_required()
def get_rewards_leaderboard():
    try:
        # Get top users by points
        users = user_model.find(
            sort=[('points', -1)],
            limit=50
        )
        
        leaderboard = []
        for i, user in enumerate(users, 1):
            user_data = {
                'rank': i,
                'user_id': user['user_id'],
                'name': user['name'],
                'points': user.get('points', 0),
                'level': user.get('level', 1),
                'badges_count': len(user.get('badges', [])),
                'carbon_saved': user.get('carbon_footprint_saved', 0)
            }
            leaderboard.append(user_data)
        
        return success_response({
            'leaderboard': leaderboard,
            'total_users': len(leaderboard)
        })
        
    except Exception as e:
        return error_response(f'Failed to get rewards leaderboard: {str(e)}', 500)