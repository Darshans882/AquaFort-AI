import json
import os
import math
from datetime import datetime

class CoatingsAI:
    def __init__(self, db_file='knowledge_base.json'):
        self.db_file = db_file
        self.knowledge_base = self.load_knowledge_base()

    def load_knowledge_base(self):
        if os.path.exists(self.db_file):
            with open(self.db_file, 'r') as f:
                return json.load(f)
        return []

    def save_knowledge_base(self):
        with open(self.db_file, 'w') as f:
            json.dump(self.knowledge_base, f, indent=2)

    def _encode_input(self, inputs):
        # Numerical encoding for distance calculation
        salinity_map = {"Low": 1, "Med": 2, "High": 3}
        # Extract number from M30, M40 etc.
        try:
            grade_val = int(inputs.get("grade", "M30").replace("M", ""))
        except:
            grade_val = 30
        
        priority_map = {"Cost": 0, "Durability": 1} # Simple binary match
        
        return {
            "salinity": salinity_map.get(inputs.get("salinity"), 1),
            "grade": grade_val,
            "priority": priority_map.get(inputs.get("priority"), 0)
        }

    def find_similar(self, user_input):
        encoded_user = self._encode_input(user_input)
        
        scored_cases = []
        for case in self.knowledge_base:
            case_inputs = case['inputs']
            encoded_case = self._encode_input(case_inputs)
            
            # Distance calculation (Euclidean-ish)
            d_salinity = (encoded_user['salinity'] - encoded_case['salinity']) ** 2
            d_grade = ((encoded_user['grade'] - encoded_case['grade']) / 10) ** 2 # Scale down
            
            # Priority acts as a filter or heavy weight
            d_priority = 0 if encoded_user['priority'] == encoded_case['priority'] else 5
            
            distance = math.sqrt(d_salinity + d_grade + d_priority)
            
            scored_cases.append({
                "case": case,
                "distance": distance
            })
            
        # Sort by distance (lowest is best)
        scored_cases.sort(key=lambda x: x['distance'])
        
        # Return top match
        best_match = scored_cases[0]['case'] if scored_cases else None
        
        explanation = "No historical data found."
        if best_match:
            explanation = f"Selected because it matched closely with a past project (ID: {best_match['id']}) which had a performance score of {best_match['outcome']}."
            
        return best_match, explanation

    def learn_outcome(self, inputs, formulation, outcome_score, feedback_notes=""):
        new_case = {
            "id": f"case_{len(self.knowledge_base) + 1:03d}",
            "inputs": inputs,
            "formulation": formulation,
            "outcome": int(outcome_score),
            "feedback": feedback_notes,
            "timestamp": datetime.now().isoformat()
        }
        self.knowledge_base.append(new_case)
        self.save_knowledge_base()
        return new_case
