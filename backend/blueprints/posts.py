# blueprints/posts.py - Posts and social features endpoints
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.database import Post, User, Notification
from utils.validators import validate_required_fields
from utils.responses import success_response, error_response

posts_bp = Blueprint('posts', __name__)
post_model = Post()
user_model = User()
notification_model = Notification()

@posts_bp.route('', methods=['POST'])
@jwt_required()
def create_post():
    try:
        current_user_email = get_jwt_identity()
        current_user = user_model.find_one({'email': current_user_email})
        
        if not current_user:
            return error_response('User not found', 404)
        
        data = request.get_json()
        
        required_fields = ['content']
        validation_error = validate_required_fields(data, required_fields)
        if validation_error:
            return error_response(validation_error, 400)
        
        post_data = {
            'user_id': current_user['user_id'],
            'content': data['content'],
            'media_id': data.get('media_id') 
        }
        
        post_id = post_model.create_post(post_data)
        
        user_model.add_points(current_user['user_id'], 10)
        
        return success_response({
            'message': 'Post created successfully',
            'post_id': post_id
        }, 201)
        
    except Exception as e:
        return error_response(f'Failed to create post: {str(e)}', 500)

@posts_bp.route('', methods=['GET'])
@jwt_required()
def get_posts():
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        sort_by = request.args.get('sort', 'recent')
        user_id = request.args.get('user_id')
        
        skip = (page - 1) * limit
        
        query = {}
        if user_id:
            query['user_id'] = user_id
        
        sort_criteria = [('likes_count', -1), ('created_at', -1)] if sort_by == 'trending' else [('created_at', -1)]
        
        posts = post_model.find(query=query, sort=sort_criteria, limit=limit, skip=skip)
        
        enriched_posts = []
        for post in posts:
            user = user_model.find_one({'user_id': post['user_id']})
            if user:
                post_data = {
                    'post_id': post['post_id'],
                    'content': post['content'],
                    'media_id': post.get('media_id'),
                    'likes_count': post.get('likes_count', 0),
                    'comments_count': len(post.get('comments', [])),
                    'created_at': post['created_at'].isoformat(),
                    'user': {
                        'user_id': user['user_id'],
                        'name': user['name'],
                        'level': user.get('level', 1),
                        'profile_picture_id': user.get('profile_picture_id')
                    }
                }
                enriched_posts.append(post_data)
        
        return success_response({
            'posts': enriched_posts,
            'page': page,
            'limit': limit,
            'total': len(enriched_posts)
        })
        
    except Exception as e:
        return error_response(f'Failed to get posts: {str(e)}', 500)

@posts_bp.route('/<post_id>/like', methods=['POST'])
@jwt_required()
def like_post(post_id):
    try:
        current_user_email = get_jwt_identity()
        current_user = user_model.find_one({'email': current_user_email})
        
        if not current_user:
            return error_response('User not found', 404)
        
        success = post_model.like_post(post_id, current_user['user_id'])
        
        if not success:
            return error_response('Post not found', 404)
        
        post = post_model.find_one({'post_id': post_id})
        liked = current_user['user_id'] in post.get('likes', [])
        
        if liked and post['user_id'] != current_user['user_id']:
            notification_model.create_notification({
                'user_id': post['user_id'],
                'title': 'Post Liked',
                'message': f'{current_user["name"]} liked your post',
                'type': 'like',
                'data': {'post_id': post_id, 'liker_id': current_user['user_id']}
            })
        
        return success_response({
            'message': 'Post liked' if liked else 'Post unliked',
            'liked': liked,
            'likes_count': post.get('likes_count', 0)
        })
        
    except Exception as e:
        return error_response(f'Failed to like post: {str(e)}', 500)

@posts_bp.route('/<post_id>/comment', methods=['POST'])
@jwt_required()
def add_comment(post_id):
    try:
        current_user_email = get_jwt_identity()
        current_user = user_model.find_one({'email': current_user_email})
        
        if not current_user:
            return error_response('User not found', 404)
        
        data = request.get_json()
        
        validation_error = validate_required_fields(data, ['text'])
        if validation_error:
            return error_response(validation_error, 400)
        
        result = post_model.add_comment(post_id, current_user['user_id'], data['text'])
        
        if result.modified_count == 0:
            return error_response('Post not found', 404)
        
        post = post_model.find_one({'post_id': post_id})
        if post and post['user_id'] != current_user['user_id']:
            notification_model.create_notification({
                'user_id': post['user_id'],
                'title': 'New Comment',
                'message': f'{current_user["name"]} commented on your post',
                'type': 'comment',
                'data': {'post_id': post_id, 'commenter_id': current_user['user_id']}
            })
        
        user_model.add_points(current_user['user_id'], 5)
        
        return success_response({'message': 'Comment added successfully'}, 201)
        
    except Exception as e:
        return error_response(f'Failed to add comment: {str(e)}', 500)

# --- THIS FUNCTION WAS MISSING ---
@posts_bp.route('/<post_id>/comments', methods=['GET'])
@jwt_required()
def get_comments(post_id):
    try:
        post = post_model.find_one({'post_id': post_id})
        
        if not post:
            return error_response('Post not found', 404)
        
        comments = post.get('comments', [])
        
        enriched_comments = []
        for comment in comments:
            user = user_model.find_one({'user_id': comment['user_id']})
            if user:
                comment_data = {
                    'comment_id': comment['comment_id'],
                    'text': comment['text'],
                    'created_at': comment['created_at'].isoformat(),
                    'user': {
                        'user_id': user['user_id'],
                        'name': user['name'],
                        'profile_picture_id': user.get('profile_picture_id')
                    }
                }
                enriched_comments.append(comment_data)
        
        enriched_comments.sort(key=lambda x: x['created_at'], reverse=True)
        
        return success_response({
            'comments': enriched_comments,
            'total': len(enriched_comments)
        })
        
    except Exception as e:
        return error_response(f'Failed to get comments: {str(e)}', 500)
# ------------------------------------

@posts_bp.route('/<post_id>', methods=['DELETE'])
@jwt_required()
def delete_post(post_id):
    try:
        current_user_email = get_jwt_identity()
        current_user = user_model.find_one({'email': current_user_email})
        
        if not current_user:
            return error_response('User not found', 404)
        
        post = post_model.find_one({'post_id': post_id})
        
        if not post:
            return error_response('Post not found', 404)
        
        if post['user_id'] != current_user['user_id']:
            return error_response('Unauthorized to delete this post', 403)
        
        result = post_model.delete_one({'post_id': post_id})
        
        if result.deleted_count == 0:
            return error_response('Failed to delete post', 500)
        
        return success_response({'message': 'Post deleted successfully'})
        
    except Exception as e:
        return error_response(f'Failed to delete post: {str(e)}', 500)