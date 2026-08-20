from flask import Flask, jsonify
from flask_cors import CORS
import os

def create_app():
    app = Flask(__name__)
    
    # Enable Cross-Origin Resource Sharing (CORS) across workspace domains
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    app.url_map.strict_slashes = False
    
    # Application settings
    app.config.from_mapping(
        SECRET_KEY=os.getenv("SECRET_KEY", "default-dev-secret-key-1823"),
    )
    
    from app.database import init_db
    init_db(app)
    
    # Register blueprints (routes)
    from app.routes.auth import auth_bp
    from app.routes.students import students_bp
    from app.routes.teachers import teachers_bp
    from app.routes.departments import departments_bp
    from app.routes.courses import courses_bp
    from app.routes.invitations import invitations_bp
    from app.routes.attendance import attendance_bp
    from app.routes.analytics import analytics_bp
    from app.routes.reports import reports_bp
    from app.routes.storage import storage_bp
    from app.routes.workflows import workflows_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(students_bp, url_prefix="/api/students")
    app.register_blueprint(teachers_bp, url_prefix="/api/teachers")
    app.register_blueprint(departments_bp, url_prefix="/api/departments")
    app.register_blueprint(courses_bp, url_prefix="/api/courses")
    app.register_blueprint(invitations_bp, url_prefix="/api/invitations")
    app.register_blueprint(attendance_bp, url_prefix="/api/attendance")
    app.register_blueprint(analytics_bp, url_prefix="/api/analytics")
    app.register_blueprint(reports_bp, url_prefix="/api/reports")
    app.register_blueprint(storage_bp, url_prefix="/api/storage")
    app.register_blueprint(workflows_bp, url_prefix="/api/workflows")
    
    # Root status check endpoint
    @app.route("/healthz", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "healthy",
            "message": "AttendAI API service active",
            "version": "1.0.0"
        }), 200
        
    # Global exception handler
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            "status": "error",
            "message": "An internal server error occurred"
        }), 500

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "status": "error",
            "message": "Requested API route not found"
        }), 404
        
    return app
