import requests
import json
import sys

BASE_URL = "http://127.0.0.1:5000"

def run_verification():
    print("--- 1. Testing Recommendation ---")
    payload = {"salinity": "High", "grade": "M40", "priority": "Durability"}
    try:
        res = requests.post(f"{BASE_URL}/api/recommend", json=payload)
        data = res.json()
        print(f"Status: {res.status_code}")
        print(f"Response: {json.dumps(data, indent=2)}")
        
        if data.get('status') != 'success':
            print("FAIL: Recommendation failed")
            sys.exit(1)
            
        formulation = data['formulation']
        
    except Exception as e:
        print(f"FAIL: Connection error: {e}")
        sys.exit(1)

    print("\n--- 2. Testing Feedback/Learning ---")
    feedback_payload = {
        "inputs": payload,
        "formulation": formulation,
        "score": 50, # We give a bad score to see if it saves
        "notes": "Verification Test Run"
    }
    
    try:
        res = requests.post(f"{BASE_URL}/api/feedback", json=feedback_payload)
        data = res.json()
        print(f"Status: {res.status_code}")
        print(f"Response: {json.dumps(data, indent=2)}")
        
        if data.get('status') != 'success':
            print("FAIL: Feedback failed")
            sys.exit(1)
            
    except Exception as e:
        print(f"FAIL: Connection error: {e}")
        sys.exit(1)

    print("\nSUCCESS: All flow tests passed.")

if __name__ == "__main__":
    run_verification()
