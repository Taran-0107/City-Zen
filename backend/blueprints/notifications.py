# blueprints/notifications.py - Notifications endpoints
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.database import Notification, User
from utils.responses import success_response, error_response

notifications_bp = Blueprint('notifications', __name__)
notification_model = Notification()
user_model = User()

@notifications_bp.route('/<user_id>', methods=['GET'])
@jwt_required()
def get_notifications(user_id):
    try:
        current_user_email = get_jwt_identity()
        current_user = user_model.find_one({'email': current_user_email})
        
        if not current_user:
            return error_response('User not found', 404)
        
        # Check if user can access these notifications
        if current_user['user_id'] != user_id:
            return error_response('Unauthorized to access these notifications', 403)
        
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        
        skip = (page - 1) * limit
        
        # Build query
        query = {'user_id': user_id}
        if unread_only:
            query['is_read'] = False
        
        # Get notifications
        notifications = notification_model.find(
            query=query,
            sort=[('created_at', -1)],
            limit=limit,
            skip=skip
        )
        
        # Format notifications
        notification_list = []
        for notification in notifications:
            notification_data = {
                'notification_id': notification['notification_id'],
                'title': notification['title'],
                'message': notification['message'],
                'type': notification['type'],
                'is_read': notification.get('is_read', False),
                'created_at': notification['created_at'].isoformat(),
                'data': notification.get('data', {})
            }
            notification_list.append(notification_data)
        
        # Get unread count
        unread_count = notification_model.count_documents({'user_id': user_id, 'is_read': False})
        
        return success_response({
            'notifications': notification_list,
            'page': page,
            'limit': limit,
            'unread_count': unread_count,
            'total': len(notification_list)
        })
        
    except Exception as e:
        return error_response(f'Failed to get notifications: {str(e)}', 500)

@notifications_bp.route('/<notification_id>/read', methods=['POST'])
@jwt_required()
def mark_notification_read(notification_id):
    try:
        current_user_email = get_jwt_identity()
        current_user = user_model.find_one({'email': current_user_email})
        
        if not current_user:
            return error_response('User not found', 404)
        
        # Mark notification as read
        result = notification_model.mark_as_read(notification_id, current_user['user_id'])
        
        if result.modified_count == 0:
            return error_response('Notification not found or already read', 404)
        
        return success_response({'message': 'Notification marked as read'})
        
    except Exception as e:
        return error_response(f'Failed to mark notification as read: {str(e)}', 500)

@notifications_bp.route('/<user_id>/read-all', methods=['POST'])
@jwt_required()
def mark_all_notifications_read(user_id):
    try:
        current_user_email = get_jwt_identity()
        current_user = user_model.find_one({'email': current_user_email})
        
        if not current_user:
            return error_response('User not found', 404)
        
        # Check if user can mark these notifications
        if current_user['user_id'] != user_id:
            return error_response('Unauthorized to mark these notifications', 403)
        
        # Mark all notifications as read
        result = notification_model.collection.update_many(
            {'user_id': user_id, 'is_read': False},
            {'$set': {'is_read': True}}
        )
        
        return success_response({
            'message': f'Marked {result.modified_count} notifications as read'
        })
        
    except Exception as e:
        return error_response(f'Failed to mark all notifications as read: {str(e)}', 500)