from flask import Flask, render_template, request, jsonify
from logic import CoatingsAI

app = Flask(__name__)
ai = CoatingsAI()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/recommend', methods=['POST'])
def recommend():
    data = request.json
    # Expecting: { "salinity": "High", "grade": "M40", "priority": "Durability" }
    
    recommendation, explanation = ai.find_similar(data)
    
    if recommendation:
        return jsonify({
            "status": "success",
            "formulation": recommendation['formulation'],
            "explanation": explanation,
            "similar_case_id": recommendation['id'],
            "predicted_score": recommendation['outcome']
        })
    else:
        # Fallback if empty DB
        return jsonify({
            "status": "success",
            "formulation": {"silane": 50, "rha": 50},
            "explanation": "Cold start: Default balanced mix used.",
            "similar_case_id": "N/A",
            "predicted_score": 0
        })

@app.route('/api/feedback', methods=['POST'])
def feedback():
    data = request.json
    # Expecting: { "inputs": {...}, "formulation": {...}, "score": 85, "notes": "..." }
    
    new_case = ai.learn_outcome(
        data['inputs'],
        data['formulation'],
        data['score'],
        data.get('notes', '')
    )
    
    return jsonify({
        "status": "success",
        "message": "Knowledge base updated.",
        "case_id": new_case['id']
    })

@app.route('/api/analytics', methods=['GET'])
def analytics():
    # Return all cases for visualization
    data = ai.knowledge_base
    return jsonify({
        "status": "success",
        "data": data
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
