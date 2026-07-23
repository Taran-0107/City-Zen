# blueprints/media.py

from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from bson.errors import InvalidId

from models.database import User, Picture
from utils.responses import success_response, error_response
from utils.file_handler import handle_file_upload

media_bp = Blueprint("media", __name__)

user_model = User()
picture_model = Picture()


@media_bp.route("/upload", methods=["POST"])
@jwt_required()
def upload_media():
    try:
        current_user_email = get_jwt_identity()

        current_user = user_model.find_one({
            "email": current_user_email
        })

        if not current_user:
            return error_response("User not found", 404)

        if "file" not in request.files:
            return error_response("No file part in the request", 400)

        file = request.files["file"]

        if file.filename == "":
            return error_response("No file selected for upload", 400)

        upload_type = request.form.get("upload_type", "general")

        upload_result = handle_file_upload(
            file=file,
            user_id=current_user["user_id"],
            upload_type=upload_type
        )

        if not upload_result["success"]:
            return error_response(upload_result["message"], 500)

        picture_id = picture_model.store_file_info({
            "public_id": upload_result["public_id"],
            "url": upload_result["url"],
            "resource_type": upload_result["resource_type"],
            "file_type": upload_result["format"],
            "original_filename": upload_result["original_filename"],
            "file_size": upload_result["file_size"],
            "user_id": current_user["user_id"]
        })

        if upload_type == "profile":
            user_model.update_one(
                {"user_id": current_user["user_id"]},
                {
                    "$set": {
                        "profile_picture_id": str(picture_id)
                    }
                }
            )

        return success_response({
            "message": "File uploaded successfully",
            "picture_id": str(picture_id),
            "url": upload_result["url"],
            "filename": upload_result["original_filename"]
        }, 201)

    except Exception as e:
        return error_response(f"File upload failed: {str(e)}", 500)

