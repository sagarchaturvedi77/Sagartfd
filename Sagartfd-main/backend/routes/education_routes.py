from flask import Blueprint, request, jsonify
from datetime import datetime
from config import db  # Aapke project ka MongoDB connection setup

education_bp = Blueprint('education', __name__)

@education_bp.route('/api/education/subscribe', methods=['POST'])
def subscribe_education_portal():
    try:
        data = request.get_json()
        
        # Validation checks
        required_fields = ["name", "email", "contactNo", "whatsappNo", "selectedPlan"]
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"Missing field: {field}"}), 400
        
        # Direct MongoDB Entry (Aapke existing pattern ke hisab se)
        lead_document = {
            "name": data.get("name"),
            "email": data.get("email"),
            "contactNo": data.get("contactNo"),
            "whatsappNo": data.get("whatsappNo"),
            "selectedPlan": data.get("selectedPlan"),
            "agreementSigned": data.get("agreementSigned", True),
            "timestamp": datetime.utcnow(),
            "status": "Agreement Signed - Pending Payment"
        }
        
        # 'education_leads' collection me save hoga
        result = db.education_leads.insert_one(lead_document)
        
        return jsonify({
            "message": "Agreement signed and lead saved directly to DB!",
            "lead_id": str(result.inserted_id),
            "status": "success"
        }), 201

    except Exception as e:
        return jsonify({"error": str(e), "status": "failed"}), 500
