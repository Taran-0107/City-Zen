import cloudinary.uploader
from werkzeug.utils import secure_filename
from utils.validators import validate_file_type


ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
ALLOWED_DOCUMENT_EXTENSIONS = {'pdf', 'doc', 'docx', 'txt'}
ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'avi', 'mov', 'wmv', 'flv'}


def get_cloudinary_folder(upload_type, filename):
    """Determine Cloudinary folder."""

    if upload_type == "profile":
        return "cityzen/profile"

    if upload_type == "bills":
        return "cityzen/bills"

    extension = filename.rsplit(".", 1)[1].lower()

    if extension in ALLOWED_IMAGE_EXTENSIONS:
        return "cityzen/images"

    if extension in ALLOWED_VIDEO_EXTENSIONS:
        return "cityzen/videos"

    return "cityzen/documents"


def handle_file_upload(file, user_id, upload_type="general"):
    try:

        if file.filename == "":
            return {
                "success": False,
                "message": "No file selected"
            }

        all_allowed = (
            ALLOWED_IMAGE_EXTENSIONS
            | ALLOWED_DOCUMENT_EXTENSIONS
            | ALLOWED_VIDEO_EXTENSIONS
        )

        if not validate_file_type(file.filename, all_allowed):
            return {
                "success": False,
                "message": "Invalid file type"
            }

        original_filename = secure_filename(file.filename)

        folder = get_cloudinary_folder(upload_type, original_filename)

        result = cloudinary.uploader.upload(
            file,
            folder=folder,
            resource_type="auto"
        )

        return {
            "success": True,
            "public_id": result["public_id"],
            "url": result["secure_url"],
            "resource_type": result["resource_type"],
            "format": result["format"],
            "original_filename": original_filename,
            "file_size": result["bytes"]
        }

    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }

def delete_file(public_id):
    """Delete file from Cloudinary"""
    try:
        result = cloudinary.uploader.destroy(
            public_id,
            resource_type="image"  # or "auto" if you know the SDK version supports it
        )

        return result.get("result") == "ok"

    except Exception:
        return False