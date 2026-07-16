# models/database.py - Database connection and models
from pymongo import MongoClient, ASCENDING, DESCENDING
from bson import ObjectId
from datetime import datetime
import bcrypt

class Database:
    DATABASE = None
    
    @staticmethod
    def initialize(uri):
        client = MongoClient(uri)
        Database.DATABASE = client.get_database()
        Database.create_indexes()
    
    @staticmethod
    def create_indexes():
        """Create database indexes for better performance"""
        db = Database.DATABASE
        
        # Users collection indexes
        db.users.create_index("email", unique=True)
        db.users.create_index("user_id", unique=True)
        
        # Posts collection indexes
        db.posts.create_index([("created_at", DESCENDING)])
        db.posts.create_index("user_id")
        
        # Reports collection indexes
        db.reports.create_index([("created_at", DESCENDING)])
        db.reports.create_index("category")
        db.reports.create_index("location")
        
        # Bills collection indexes
        db.bills.create_index("user_id")
        db.bills.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])
        
        # Notifications collection indexes
        db.notifications.create_index("user_id")
        db.notifications.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])

class BaseModel:
    def __init__(self, collection_name):
        self.collection = Database.DATABASE[collection_name]
    
    def find_one(self, query):
        return self.collection.find_one(query)
    
    def find(self, query=None, sort=None, limit=None, skip=None):
        cursor = self.collection.find(query or {})
        if sort:
            cursor = cursor.sort(sort)
        if skip:
            cursor = cursor.skip(skip)
        if limit:
            cursor = cursor.limit(limit)
        return list(cursor)
    
    def insert_one(self, document):
        document['created_at'] = datetime.now()
        document['updated_at'] = datetime.now()
        result = self.collection.insert_one(document)
        return result.inserted_id
    
    def update_one(self, query, update):
        update['$set'] = update.get('$set', {})
        update['$set']['updated_at'] = datetime.now()
        return self.collection.update_one(query, update)
    
    def delete_one(self, query):
        return self.collection.delete_one(query)
    
    def count_documents(self, query=None):
        return self.collection.count_documents(query or {})

# User Model
class User(BaseModel):
    def __init__(self):
        super().__init__('users')
    
    def create_user(self, user_data):
        # Hash password
        password_hash = bcrypt.hashpw(user_data['password'].encode('utf-8'), bcrypt.gensalt())
        
        user = {
            'user_id': str(ObjectId()),
            'name': user_data['name'],
            'email': user_data['email'].lower(),
            'password_hash': password_hash,
            'profile_picture_id': user_data.get('profile_picture_id'),
            'points': 0,
            'badges': [],
            'level': 1,
            'carbon_footprint_saved': 0.0,
            'followers': [],
            'following': []
        }
        
        self.insert_one(user)
        return user['user_id']
    
    def verify_password(self, email, password):
        user = self.find_one({'email': email.lower()})
        if user and bcrypt.checkpw(password.encode('utf-8'), user['password_hash']):
            return user
        return None
    
    def add_points(self, user_id, points):
        user = self.find_one({'user_id': user_id})
        if user:
            new_points = user['points'] + points
            new_level = max(1, new_points // 100)  # Level up every 100 points
            
            self.update_one(
                {'user_id': user_id},
                {'$set': {'points': new_points, 'level': new_level}}
            )
            return True
        return False

# Post Model
class Post(BaseModel):
    def __init__(self):
        super().__init__('posts')
    
    def create_post(self, post_data):
        post = {
            'post_id': str(ObjectId()),
            'user_id': post_data['user_id'],
            'content': post_data['content'],
            'media_id': post_data.get('media_id'),
            'likes': [],
            'likes_count': 0,
            'comments': []
        }
        self.insert_one(post)
        return post['post_id']
    
    def like_post(self, post_id, user_id):
        post = self.find_one({'post_id': post_id})
        if not post:
            return False
        
        if user_id in post.get('likes', []):
            # Unlike
            self.update_one(
                {'post_id': post_id},
                {'$pull': {'likes': user_id}, '$inc': {'likes_count': -1}}
            )
        else:
            # Like
            self.update_one(
                {'post_id': post_id},
                {'$push': {'likes': user_id}, '$inc': {'likes_count': 1}}
            )
        return True
    
    def add_comment(self, post_id, user_id, comment_text):
        comment = {
            'comment_id': str(ObjectId()),
            'user_id': user_id,
            'text': comment_text,
            'created_at': datetime.now()
        }
        
        return self.update_one(
            {'post_id': post_id},
            {'$push': {'comments': comment}}
        )

# Report Model
class Report(BaseModel):
    def __init__(self):
        super().__init__('reports')
    
    def create_report(self, report_data):
        report = {
            'report_id': str(ObjectId()),
            'user_id': report_data['user_id'],
            'title': report_data.get('title', ''),
            'category': report_data.get('category', ''),
            'location': report_data.get('location', ''),
            'description': report_data.get('description', ''),
            'evidence_id': report_data.get('evidence_id'),
            'likes': [],
            'likes_count': 0,
            'verifications': [],
            'verification_count': 0
        }
        self.insert_one(report)
        return report['report_id']
    
    def like_report(self, report_id, user_id):
        report = self.find_one({'report_id': report_id})
        if not report:
            return False
        
        if user_id in report.get('likes', []):
            self.update_one(
                {'report_id': report_id},
                {'$pull': {'likes': user_id}, '$inc': {'likes_count': -1}}
            )
        else:
            self.update_one(
                {'report_id': report_id},
                {'$push': {'likes': user_id}, '$inc': {'likes_count': 1}}
            )
        return True
    
    def verify_report(self, report_id, user_id):
        report = self.find_one({'report_id': report_id})
        if not report:
            return False
        
        if user_id not in report.get('verifications', []):
            self.update_one(
                {'report_id': report_id},
                {'$push': {'verifications': user_id}, '$inc': {'verification_count': 1}}
            )
        return True

# Bill Model
class Bill(BaseModel):
    def __init__(self):
        super().__init__('bills')
    
    def create_bill(self, bill_data):
        bill = {
            'bill_id': str(ObjectId()),
            'user_id': bill_data['user_id'],
            'type': bill_data['type'],  # 'water', 'electricity', 'gas'
            'usage_amount': bill_data['usage_amount'],
            'usage_unit': bill_data['usage_unit'],  # 'kWh', 'liters', 'cubic_meters'
            'cost': bill_data['cost'],
            'billing_period': bill_data['billing_period'],
            'file_id': bill_data.get('file_id')
        }
        self.insert_one(bill)
        return bill['bill_id']
    
    def get_usage_comparison(self, user_id, bill_type):
        # Get last two bills for comparison
        bills = self.find(
            {'user_id': user_id, 'type': bill_type},
            sort=[('created_at', DESCENDING)],
            limit=2
        )
        
        if len(bills) < 2:
            return None
        
        current = bills[0]
        previous = bills[1]
        
        usage_diff = current['usage_amount'] - previous['usage_amount']
        cost_diff = current['cost'] - previous['cost']
        
        return {
            'current_usage': current['usage_amount'],
            'previous_usage': previous['usage_amount'],
            'usage_difference': usage_diff,
            'cost_difference': cost_diff,
            'percentage_change': (usage_diff / previous['usage_amount'] * 100) if previous['usage_amount'] > 0 else 0
        }

# Picture/Media Model
class Picture(BaseModel):
    def __init__(self):
        super().__init__('pictures')
    
    def store_file_info(self, file_data):
        picture = {
            'filename': file_data['filename'],
            'file_type': file_data['file_type'],
            'file_path': file_data['file_path'],
            'user_id': file_data['user_id']
        }

        return self.insert_one(picture)

# Reward Model
class Reward(BaseModel):
    def __init__(self):
        super().__init__('rewards')
    
    def create_reward(self, reward_data):
        reward = {
            'reward_id': str(ObjectId()),
            'title': reward_data['title'],
            'description': reward_data['description'],
            'points_required': reward_data['points_required'],
            'badge_name': reward_data.get('badge_name'),
            'task_type': reward_data['task_type'],
            'task_count': reward_data.get('task_count', 1)
        }
        self.insert_one(reward)
        return reward['reward_id']

# Notification Model
class Notification(BaseModel):
    def __init__(self):
        super().__init__('notifications')
    
    def create_notification(self, notification_data):
        notification = {
            'notification_id': str(ObjectId()),
            'user_id': notification_data['user_id'],
            'title': notification_data['title'],
            'message': notification_data['message'],
            'type': notification_data['type'],  # 'reward', 'achievement', 'post', 'report'
            'is_read': False,
            'data': notification_data.get('data', {})
        }
        self.insert_one(notification)
        return notification['notification_id']
    
    def mark_as_read(self, notification_id, user_id):
        return self.update_one(
            {'notification_id': notification_id, 'user_id': user_id},
            {'$set': {'is_read': True}}
        )
