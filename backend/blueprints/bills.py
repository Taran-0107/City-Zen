# blueprints/bills.py - Resource tracking and bill management endpoints
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.database import Bill, User, Picture, Notification
from utils.validators import validate_required_fields
from utils.responses import success_response, error_response
from utils.file_handler import handle_file_upload
from utils.carbon_calculator import calculate_carbon_savings

bills_bp = Blueprint('bills', __name__)
bill_model = Bill()
user_model = User()
picture_model = Picture()
notification_model = Notification()

@bills_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_bill():
    try:
        current_user_email = get_jwt_identity()
        current_user = user_model.find_one({'email': current_user_email})
        
        if not current_user:
            return error_response('User not found', 404)
        
        # Check if file is present
        if 'file' not in request.files:
            return error_response('No file uploaded', 400)
        
        file = request.files['file']
        if file.filename == '':
            return error_response('No file selected', 400)
        
        # Handle file upload
        file_info = handle_file_upload(file, current_user['user_id'], 'bills')
        
        if not file_info['success']:
            return error_response(file_info['message'], 400)
        
        # Store file information in pictures collection
        picture_id = picture_model.store_file_info({
            'filename': file_info['filename'],
            'file_type': file_info['file_type'],
            'file_path': file_info['file_path'],
            'user_id': current_user['user_id']
        })
        
        return success_response({
            'message': 'Bill uploaded successfully',
            'file_id': picture_id,
            'filename': file_info['filename']
        }, 201)
        
    except Exception as e:
        return error_response(f'Failed to upload bill: {str(e)}', 500)

@bills_bp.route('/manual-entry', methods=['POST'])
@jwt_required()
def manual_entry():
    try:
        current_user_email = get_jwt_identity()
        current_user = user_model.find_one({'email': current_user_email})
        
        if not current_user:
            return error_response('User not found', 404)
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['type', 'usage_amount', 'usage_unit', 'cost', 'billing_period']
        validation_error = validate_required_fields(data, required_fields)
        if validation_error:
            return error_response(validation_error, 400)
        
        # Validate bill type
        valid_types = ['water', 'electricity', 'gas']
        if data['type'] not in valid_types:
            return error_response(f'Invalid bill type. Must be one of: {valid_types}', 400)
        
        # Create bill record
        bill_data = {
            'user_id': current_user['user_id'],
            'type': data['type'],
            'usage_amount': float(data['usage_amount']),
            'usage_unit': data['usage_unit'],
            'cost': float(data['cost']),
            'billing_period': data['billing_period'],
            'file_id': data.get('file_id')
        }
        
        bill_id = bill_model.create_bill(bill_data)
        
        # Calculate carbon footprint reduction (if this is a reduction from previous bill)
        comparison = bill_model.get_usage_comparison(current_user['user_id'], data['type'])
        if comparison and comparison['usage_difference'] < 0:  # Usage reduced
            carbon_saved = calculate_carbon_savings(data['type'], abs(comparison['usage_difference']))
            
            # Update user's carbon footprint
            user_model.update_one(
                {'user_id': current_user['user_id']},
                {'$inc': {'carbon_footprint_saved': carbon_saved}}
            )
            
            # Award points for reducing usage
            points_earned = min(50, int(abs(comparison['percentage_change'])))  # Max 50 points
            user_model.add_points(current_user['user_id'], points_earned)
            
            # Create achievement notification
            notification_model.create_notification({
                'user_id': current_user['user_id'],
                'title': 'Great Job!',
                'message': f'You saved {carbon_saved:.1f}kg CO2 by reducing your {data["type"]} usage!',
                'type': 'achievement',
                'data': {'carbon_saved': carbon_saved, 'points_earned': points_earned}
            })
        
        return success_response({
            'message': 'Bill recorded successfully',
            'bill_id': bill_data['bill_id']
        }, 201)
        
    except Exception as e:
        return error_response(f'Failed to record bill: {str(e)}', 500)

@bills_bp.route('/history/<user_id>', methods=['GET'])
@jwt_required()
def get_bill_history(user_id):
    try:
        current_user_email = get_jwt_identity()
        current_user = user_model.find_one({'email': current_user_email})
        
        if not current_user:
            return error_response('User not found', 404)
        
        # Check if user can access this history
        if current_user['user_id'] != user_id:
            return error_response('Unauthorized to access this bill history', 403)
        
        # Get query parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        bill_type = request.args.get('type')
        
        skip = (page - 1) * limit
        
        # Build query
        query = {'user_id': user_id}
        if bill_type:
            query['type'] = bill_type
        
        # Get bills sorted by creation date (newest first)
        bills = bill_model.find(
            query=query,
            sort=[('created_at', -1)],
            limit=limit,
            skip=skip
        )
        
        # Format bill data
        bill_history = []
        for bill in bills:
            bill_data = {
                'bill_id': bill['bill_id'],
                'type': bill['type'],
                'usage_amount': bill['usage_amount'],
                'usage_unit': bill['usage_unit'],
                'cost': bill['cost'],
                'billing_period': bill['billing_period'],
                'created_at': bill['created_at'].isoformat(),
                'file_id': bill.get('file_id')
            }
            bill_history.append(bill_data)
        
        return success_response({
            'bills': bill_history,
            'page': page,
            'limit': limit,
            'total': len(bill_history)
        })
        
    except Exception as e:
        return error_response(f'Failed to get bill history: {str(e)}', 500)

@bills_bp.route('/comparison/<user_id>', methods=['GET'])
@jwt_required()
def get_usage_comparison(user_id):
    try:
        current_user_email = get_jwt_identity()
        current_user = user_model.find_one({'email': current_user_email})
        
        if not current_user:
            return error_response('User not found', 404)
        
        # Check if user can access this comparison
        if current_user['user_id'] != user_id:
            return error_response('Unauthorized to access this comparison', 403)
        
        bill_type = request.args.get('type')
        if not bill_type:
            return error_response('Bill type is required', 400)
        
        # Get usage comparison
        comparison = bill_model.get_usage_comparison(user_id, bill_type)
        
        if not comparison:
            return error_response('Not enough data for comparison (need at least 2 bills)', 404)
        
        # Calculate environmental impact
        if comparison['usage_difference'] < 0:  # Usage reduced
            carbon_saved = calculate_carbon_savings(bill_type, abs(comparison['usage_difference']))
            impact_message = f"Great! You saved {carbon_saved:.1f}kg CO2 equivalent"
        else:  # Usage increased
            carbon_increased = calculate_carbon_savings(bill_type, comparison['usage_difference'])
            impact_message = f"Your usage increased by {carbon_increased:.1f}kg CO2 equivalent"
        
        comparison['environmental_impact'] = impact_message
        comparison['bill_type'] = bill_type
        
        return success_response(comparison)
        
    except Exception as e:
        return error_response(f'Failed to get usage comparison: {str(e)}', 500)

@bills_bp.route('/carbon-footprint/<user_id>', methods=['GET'])
@jwt_required()
def get_carbon_footprint(user_id):
    try:
        current_user_email = get_jwt_identity()
        current_user = user_model.find_one({'email': current_user_email})
        
        if not current_user:
            return error_response('User not found', 404)
        
        # Check if user can access this footprint data
        if current_user['user_id'] != user_id:
            return error_response('Unauthorized to access this carbon footprint data', 403)
        
        # Get user's total carbon footprint saved
        user = user_model.find_one({'user_id': user_id})
        if not user:
            return error_response('User not found', 404)
        
        # Calculate detailed carbon footprint by bill type
        bill_types = ['water', 'electricity', 'gas']
        footprint_breakdown = {}
        total_saved = 0
        
        for bill_type in bill_types:
            # Get all bills of this type
            bills = bill_model.find(
                {'user_id': user_id, 'type': bill_type},
                sort=[('created_at', -1)]
            )
            
            type_savings = 0
            comparisons = []
            
            # Calculate savings for each consecutive pair of bills
            for i in range(len(bills) - 1):
                current_bill = bills[i]
                previous_bill = bills[i + 1]
                
                usage_diff = previous_bill['usage_amount'] - current_bill['usage_amount']
                if usage_diff > 0:  # Current usage is less than previous (savings)
                    carbon_saved = calculate_carbon_savings(bill_type, usage_diff)
                    type_savings += carbon_saved
                    comparisons.append({
                        'period': current_bill['billing_period'],
                        'carbon_saved': carbon_saved,
                        'usage_reduced': usage_diff
                    })
            
            footprint_breakdown[bill_type] = {
                'total_carbon_saved': type_savings,
                'bills_count': len(bills),
                'recent_comparisons': comparisons[:3]  # Last 3 comparisons
            }
            total_saved += type_savings
        
        # Calculate equivalent impact (trees, cars, etc.)
        trees_equivalent = total_saved / 22  # 1 tree absorbs ~22kg CO2 per year
        car_miles_equivalent = total_saved / 0.404  # ~0.404kg CO2 per mile
        
        return success_response({
            'user_id': user_id,
            'total_carbon_saved': total_saved,
            'stored_carbon_saved': user.get('carbon_footprint_saved', 0),
            'breakdown_by_type': footprint_breakdown,
            'equivalent_impact': {
                'trees_planted': round(trees_equivalent, 1),
                'car_miles_saved': round(car_miles_equivalent, 1),
                'description': f'Equivalent to planting {trees_equivalent:.1f} trees or avoiding {car_miles_equivalent:.0f} miles of car travel'
            }
        })
        
    except Exception as e:
        return error_response(f'Failed to get carbon footprint: {str(e)}', 500)

@bills_bp.route('/types', methods=['GET'])
@jwt_required()
def get_bill_types():
    try:
        # Return available bill types and their units
        bill_types = {
            'electricity': {
                'units': ['kWh', 'MWh'],
                'description': 'Electrical energy consumption'
            },
            'water': {
                'units': ['liters', 'cubic_meters', 'gallons'],
                'description': 'Water consumption'
            },
            'gas': {
                'units': ['cubic_meters', 'therms', 'kWh'],
                'description': 'Natural gas consumption'
            }
        }
        
        return success_response({'bill_types': bill_types})
        
    except Exception as e:
        return error_response(f'Failed to get bill types: {str(e)}', 500)

@bills_bp.route('/<bill_id>', methods=['GET'])
@jwt_required()
def get_bill_details(bill_id):
    try:
        current_user_email = get_jwt_identity()
        current_user = user_model.find_one({'email': current_user_email})
        
        if not current_user:
            return error_response('User not found', 404)
        
        # Get bill details
        bill = bill_model.find_one({'bill_id': bill_id})
        if not bill:
            return error_response('Bill not found', 404)
        
        # Check if user can access this bill
        if bill['user_id'] != current_user['user_id']:
            return error_response('Unauthorized to access this bill', 403)
        
        bill_data = {
            'bill_id': bill['bill_id'],
            'type': bill['type'],
            'usage_amount': bill['usage_amount'],
            'usage_unit': bill['usage_unit'],
            'cost': bill['cost'],
            'billing_period': bill['billing_period'],
            'created_at': bill['created_at'].isoformat(),
            'file_id': bill.get('file_id')
        }
        
        return success_response(bill_data)
        
    except Exception as e:
        return error_response(f'Failed to get bill details: {str(e)}', 500)

@bills_bp.route('/<bill_id>', methods=['PUT'])
@jwt_required()
def update_bill(bill_id):
    try:
        current_user_email = get_jwt_identity()
        current_user = user_model.find_one({'email': current_user_email})
        
        if not current_user:
            return error_response('User not found', 404)
        
        # Check if bill exists and belongs to current user
        bill = bill_model.find_one({'bill_id': bill_id})
        if not bill:
            return error_response('Bill not found', 404)
        
        if bill['user_id'] != current_user['user_id']:
            return error_response('Unauthorized to update this bill', 403)
        
        data = request.get_json()
        
        # Allowed fields for update
        allowed_fields = ['usage_amount', 'usage_unit', 'cost', 'billing_period']
        update_data = {}
        
        for field in allowed_fields:
            if field in data:
                if field in ['usage_amount', 'cost']:
                    update_data[field] = float(data[field])
                else:
                    update_data[field] = data[field]
        
        if not update_data:
            return error_response('No valid fields to update', 400)
        
        # Update bill
        result = bill_model.update_one(
            {'bill_id': bill_id},
            {'$set': update_data}
        )
        
        if result.modified_count == 0:
            return error_response('No changes made', 400)
        
        return success_response({'message': 'Bill updated successfully'})
        
    except Exception as e:
        return error_response(f'Failed to update bill: {str(e)}', 500)

@bills_bp.route('/<bill_id>', methods=['DELETE'])
@jwt_required()
def delete_bill(bill_id):
    try:
        current_user_email = get_jwt_identity()
        current_user = user_model.find_one({'email': current_user_email})
        
        if not current_user:
            return error_response('User not found', 404)
        
        # Check if bill exists and belongs to current user
        bill = bill_model.find_one({'bill_id': bill_id})
        
        if not bill:
            return error_response('Bill not found', 404)
        
        if bill['user_id'] != current_user['user_id']:
            return error_response('Unauthorized to delete this bill', 403)
        
        # Delete the bill
        result = bill_model.delete_one({'bill_id': bill_id})
        
        if result.deleted_count == 0:
            return error_response('Failed to delete bill', 500)
        
        return success_response({'message': 'Bill deleted successfully'})
        
    except Exception as e:
        return error_response(f'Failed to delete bill: {str(e)}', 500)

@bills_bp.route('/analytics/<user_id>', methods=['GET'])
@jwt_required()
def get_usage_analytics(user_id):
    try:
        current_user_email = get_jwt_identity()
        current_user = user_model.find_one({'email': current_user_email})
        
        if not current_user:
            return error_response('User not found', 404)
        
        # Check if user can access this analytics
        if current_user['user_id'] != user_id:
            return error_response('Unauthorized to access this analytics', 403)
        
        # Get analytics for each bill type
        bill_types = ['water', 'electricity', 'gas']
        analytics = {}
        
        for bill_type in bill_types:
            bills = bill_model.find(
                {'user_id': user_id, 'type': bill_type},
                sort=[('billing_period', 1)]
            )
            
            if not bills:
                analytics[bill_type] = {
                    'total_bills': 0,
                    'average_usage': 0,
                    'average_cost': 0,
                    'trend': 'no_data'
                }
                continue
            
            total_usage = sum(bill['usage_amount'] for bill in bills)
            total_cost = sum(bill['cost'] for bill in bills)
            
            # Calculate trend (comparing first half vs second half)
            mid_point = len(bills) // 2
            if mid_point > 0:
                first_half_avg = sum(bill['usage_amount'] for bill in bills[:mid_point]) / mid_point
                second_half_avg = sum(bill['usage_amount'] for bill in bills[mid_point:]) / (len(bills) - mid_point)
                
                if second_half_avg < first_half_avg * 0.95:  # 5% reduction threshold
                    trend = 'decreasing'
                elif second_half_avg > first_half_avg * 1.05:  # 5% increase threshold
                    trend = 'increasing'
                else:
                    trend = 'stable'
            else:
                trend = 'insufficient_data'
            
            analytics[bill_type] = {
                'total_bills': len(bills),
                'average_usage': round(total_usage / len(bills), 2),
                'average_cost': round(total_cost / len(bills), 2),
                'total_usage': round(total_usage, 2),
                'total_cost': round(total_cost, 2),
                'trend': trend,
                'latest_usage': bills[-1]['usage_amount'] if bills else 0,
                'latest_cost': bills[-1]['cost'] if bills else 0
            }
        
        return success_response({
            'user_id': user_id,
            'analytics': analytics,
            'generated_at': bill_model.find_one({})['created_at'].isoformat() if bill_model.find_one({}) else None
        })
        
    except Exception as e:
        return error_response(f'Failed to get usage analytics: {str(e)}', 500)