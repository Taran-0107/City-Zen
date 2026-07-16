# blueprints/reports.py - Environmental reports endpoints
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.database import Report, User, Notification
from utils.responses import success_response, error_response

reports_bp = Blueprint('reports', __name__)
report_model = Report()
user_model = User()
notification_model = Notification()

@reports_bp.route('', methods=['POST'])
@jwt_required()
def create_report():
    try:
        current_user_email = get_jwt_identity()
        current_user = user_model.find_one({'email': current_user_email})
        
        if not current_user:
            return error_response('User not found', 404)
        
        data = request.get_json()
        
        report_data = {
            'user_id': current_user['user_id'],
            'title': data.get('title', ''),
            'category': data.get('category', ''),
            'location': data.get('location', ''),
            'description': data.get('description', ''),
            'evidence_id': data.get('evidence_id')
        }
        
        report_id = report_model.create_report(report_data)
        
        user_model.add_points(current_user['user_id'], 20)
        
        user_model.update_one(
            {'user_id': current_user['user_id']},
            {'$inc': {'carbon_footprint_saved': 5.0}}
        )
        
        return success_response({
            'message': 'Report created successfully',
            'report_id': report_id
        }, 201)
        
    except Exception as e:
        return error_response(f'Failed to create report: {str(e)}', 500)

@reports_bp.route('', methods=['GET'])
@jwt_required()
def get_reports():
    try:
        # Get query parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        category = request.args.get('category')
        location = request.args.get('location')
        user_id = request.args.get('user_id')
        
        skip = (page - 1) * limit
        
        # Build query
        query = {}
        if category:
            query['category'] = category
        if location:
            query['location'] = {'$regex': location, '$options': 'i'}
        if user_id:
            query['user_id'] = user_id
        
        # Get reports sorted by creation date (newest first)
        reports = report_model.find(
            query=query,
            sort=[('created_at', -1)],
            limit=limit,
            skip=skip
        )
        
        # Enrich reports with user information
        enriched_reports = []
        for report in reports:
            user = user_model.find_one({'user_id': report['user_id']})
            if user:
                report_data = {
                    'report_id': report['report_id'],
                    'title': report.get('title', ''),
                    'category': report.get('category', ''),
                    'location': report.get('location', ''),
                    'description': report.get('description', ''),
                    'evidence_id': report.get('evidence_id'),
                    'likes_count': report.get('likes_count', 0),
                    'verification_count': report.get('verification_count', 0),
                    'created_at': report['created_at'].isoformat(),
                    'user': {
                        'user_id': user['user_id'],
                        'name': user['name'],
                        'level': user['level'],
                        'profile_picture_id': user.get('profile_picture_id')
                    }
                }
                enriched_reports.append(report_data)
        
        return success_response({
            'reports': enriched_reports,
            'page': page,
            'limit': limit,
            'total': len(enriched_reports)
        })
        
    except Exception as e:
        return error_response(f'Failed to get reports: {str(e)}', 500)

@reports_bp.route('/<report_id>/like', methods=['POST'])
@jwt_required()
def like_report(report_id):
    try:
        current_user_email = get_jwt_identity()
        current_user = user_model.find_one({'email': current_user_email})
        
        if not current_user:
            return error_response('User not found', 404)
        
        # Like/unlike the report
        success = report_model.like_report(report_id, current_user['user_id'])
        
        if not success:
            return error_response('Report not found', 404)
        
        # Get updated report to check like status
        report = report_model.find_one({'report_id': report_id})
        liked = current_user['user_id'] in report.get('likes', [])
        
        # Create notification for report owner (if liked, not unliked)
        if liked and report['user_id'] != current_user['user_id']:
            notification_model.create_notification({
                'user_id': report['user_id'],
                'title': 'Report Liked',
                'message': f'{current_user["name"]} liked your report',
                'type': 'like',
                'data': {'report_id': report_id, 'liker_id': current_user['user_id']}
            })
        
        return success_response({
            'message': 'Report liked' if liked else 'Report unliked',
            'liked': liked,
            'likes_count': report.get('likes_count', 0)
        })
        
    except Exception as e:
        return error_response(f'Failed to like report: {str(e)}', 500)

@reports_bp.route('/<report_id>/verify', methods=['POST'])
@jwt_required()
def verify_report(report_id):
    try:
        current_user_email = get_jwt_identity()
        current_user = user_model.find_one({'email': current_user_email})
        
        if not current_user:
            return error_response('User not found', 404)
        
        # Verify the report
        success = report_model.verify_report(report_id, current_user['user_id'])
        
        if not success:
            return error_response('Report not found', 404)
        
        # Get updated report
        report = report_model.find_one({'report_id': report_id})
        
        # Create notification for report owner
        if report and report['user_id'] != current_user['user_id']:
            notification_model.create_notification({
                'user_id': report['user_id'],
                'title': 'Report Verified',
                'message': f'{current_user["name"]} verified your report',
                'type': 'verification',
                'data': {'report_id': report_id, 'verifier_id': current_user['user_id']}
            })
        
        # Award points to verifier
        user_model.add_points(current_user['user_id'], 5)
        
        return success_response({
            'message': 'Report verified successfully',
            'verification_count': report.get('verification_count', 0)
        })
        
    except Exception as e:
        return error_response(f'Failed to verify report: {str(e)}', 500)

@reports_bp.route('/categories', methods=['GET'])
@jwt_required()
def get_report_categories():
    try:
        # Predefined categories for environmental reports
        categories = [
            'Water Pollution',
            'Air Pollution',
            'Waste Management',
            'Deforestation',
            'Illegal Dumping',
            'Wildlife Protection',
            'Noise Pollution',
            'Soil Contamination',
            'Energy Waste',
            'Other'
        ]
        
        return success_response({'categories': categories})
        
    except Exception as e:
        return error_response(f'Failed to get categories: {str(e)}', 500)

@reports_bp.route('/<report_id>', methods=['GET'])
@jwt_required()
def get_report_details(report_id):
    try:
        report = report_model.find_one({'report_id': report_id})
        
        if not report:
            return error_response('Report not found', 404)
        
        # Get user information
        user = user_model.find_one({'user_id': report['user_id']})
        
        if not user:
            return error_response('Report user not found', 404)
        
        # Get current user for like/verification status
        current_user_email = get_jwt_identity()
        current_user = user_model.find_one({'email': current_user_email})
        
        report_data = {
            'report_id': report['report_id'],
            'title': report.get('title', ''),
            'category': report.get('category', ''),
            'location': report.get('location', ''),
            'description': report.get('description', ''),
            'evidence_id': report.get('evidence_id'),
            'likes_count': report.get('likes_count', 0),
            'verification_count': report.get('verification_count', 0),
            'created_at': report['created_at'].isoformat(),
            'user': {
                'user_id': user['user_id'],
                'name': user['name'],
                'level': user['level'],
                'profile_picture_id': user.get('profile_picture_id')
            }
        }
        
        # Add current user's interaction status
        if current_user:
            report_data['user_liked'] = current_user['user_id'] in report.get('likes', [])
            report_data['user_verified'] = current_user['user_id'] in report.get('verifications', [])
        
        return success_response(report_data)
        
    except Exception as e:
        return error_response(f'Failed to get report details: {str(e)}', 500)

@reports_bp.route('/<report_id>', methods=['DELETE'])
@jwt_required()
def delete_report(report_id):
    try:
        current_user_email = get_jwt_identity()
        current_user = user_model.find_one({'email': current_user_email})
        
        if not current_user:
            return error_response('User not found', 404)
        
        # Check if report exists and belongs to current user
        report = report_model.find_one({'report_id': report_id})
        
        if not report:
            return error_response('Report not found', 404)
        
        if report['user_id'] != current_user['user_id']:
            return error_response('Unauthorized to delete this report', 403)
        
        # Delete the report
        result = report_model.delete_one({'report_id': report_id})
        
        if result.deleted_count == 0:
            return error_response('Failed to delete report', 500)
        
        return success_response({'message': 'Report deleted successfully'})
        
    except Exception as e:
        return error_response(f'Failed to delete report: {str(e)}', 500)
