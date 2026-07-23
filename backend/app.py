# app.py - Main Flask Application
from flask import Flask,render_template
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from datetime import timedelta
import os
from dotenv import load_dotenv
from werkzeug.exceptions import HTTPException

# Import database models
from models.database import Database
import cloudinary


load_dotenv()

def create_app():
    app = Flask(__name__)
    
    # Configuration
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)
    app.config['MONGO_URI'] = os.environ.get('MONGO_URI')
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
    app.config['CLOUDINARY_URL'] = os.environ.get('CLOUDINARY_URL')

    cloudinary.config(
        cloudinary_url=app.config['CLOUDINARY_URL'],
        secure=True
    )

    
    # Initialize extensions
    CORS(app)
    JWTManager(app)
    
    # Initialize database
    Database.initialize(app.config['MONGO_URI'])
    
    # Import and Register blueprints
    from blueprints.auth import auth_bp
    from blueprints.users import users_bp
    from blueprints.posts import posts_bp
    from blueprints.rewards import rewards_bp
    from blueprints.bills import bills_bp
    from blueprints.reports import reports_bp
    from blueprints.leaderboard import leaderboard_bp
    from blueprints.notifications import notifications_bp
    from blueprints.admin import admin_bp
    from blueprints.media import media_bp
    from blueprints.uploads import uploads_bp
    
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(users_bp, url_prefix='/users')
    app.register_blueprint(posts_bp, url_prefix='/posts')
    app.register_blueprint(rewards_bp, url_prefix='/rewards')
    app.register_blueprint(bills_bp, url_prefix='/bills')
    app.register_blueprint(reports_bp, url_prefix='/reports')
    app.register_blueprint(leaderboard_bp, url_prefix='/leaderboard')
    app.register_blueprint(notifications_bp, url_prefix='/notifications')
    app.register_blueprint(admin_bp, url_prefix='/admin')
    app.register_blueprint(media_bp, url_prefix='/media') 
    app.register_blueprint(uploads_bp, url_prefix='/uploads')
    # Error handlers
    @app.errorhandler(HTTPException)
    def handle_exception(e):
        return {'error': e.description}, e.code
    
    @app.errorhandler(404)
    def not_found(e):
        return {'error': 'Endpoint not found'}, 404
    
    @app.errorhandler(500)
    def internal_error(e):
        return {'error': 'Internal server error'}, 500
    
    # Health check endpoint
    @app.route('/health')
    def health_check():
        return {'status': 'healthy', 'message': 'Sustainability App Backend is running'}
    
    @app.route('/')
    def index():
        return render_template('index.html')
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5001)

else:
    app = create_app()