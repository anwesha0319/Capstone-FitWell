#!/usr/bin/env python3
"""
Test script to verify all models (Diet, Marathon, Workout, Water Intake) are working
"""

import requests
import json
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://192.168.29.52:8000/api"
# You'll need to get a valid token from your app
# For testing, you can get it from AsyncStorage in the app or create a test user

def test_endpoint(endpoint, method="GET", data=None, token=None):
    """Test a single endpoint"""
    url = f"{BASE_URL}{endpoint}"
    headers = {}
    
    if token:
        headers['Authorization'] = f"Token {token}"
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers)
        elif method == "POST":
            headers['Content-Type'] = 'application/json'
            response = requests.post(url, headers=headers, json=data)
        elif method == "PUT":
            headers['Content-Type'] = 'application/json'
            response = requests.put(url, headers=headers, json=data)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers)
        
        print(f"\n{'='*60}")
        print(f"Testing: {method} {endpoint}")
        print(f"Status: {response.status_code}")
        
        if response.status_code >= 400:
            print(f"Error: {response.text}")
        else:
            try:
                result = response.json()
                print(f"Response: {json.dumps(result, indent=2)[:500]}...")
            except:
                print(f"Response: {response.text[:500]}...")
        
        return response
        
    except Exception as e:
        print(f"\n{'='*60}")
        print(f"Testing: {method} {endpoint}")
        print(f"Exception: {str(e)}")
        return None

def main():
    print("Testing all model endpoints...")
    print("Note: You need to provide a valid auth token for testing")
    
    # Get token from user
    token = input("\nEnter your auth token (or press Enter to skip auth tests): ").strip()
    
    if token:
        print("\n" + "="*60)
        print("Testing with authentication...")
        print("="*60)
        
        # Test Water Intake endpoints
        today = datetime.now().strftime("%Y-%m-%d")
        
        # 1. Test Water Intake - Save
        water_data = {
            "amount": 2.5,
            "goal": 3.0,
            "date": today
        }
        test_endpoint("/health/water-intake/", "POST", water_data, token)
        
        # 2. Test Water Intake - Get specific date
        test_endpoint(f"/health/water-intake/get/?date={today}", "GET", None, token)
        
        # 3. Test Water Intake - Get last 7 days
        test_endpoint("/health/water-intake/get/?days=7", "GET", None, token)
        
        # 4. Test Diet endpoints - List
        test_endpoint("/health/diet/", "GET", None, token)
        
        # 5. Test Diet endpoints - Create
        diet_data = {
            "daily_calories": 2000,
            "meal_plan": {
                "breakfast": "Oatmeal with fruits",
                "lunch": "Chicken salad",
                "dinner": "Grilled fish with vegetables"
            }
        }
        response = test_endpoint("/health/diet/", "POST", diet_data, token)
        
        # If creation successful, test detail endpoint
        if response and response.status_code == 201:
            try:
                diet_id = response.json().get('id')
                if diet_id:
                    test_endpoint(f"/health/diet/{diet_id}/", "GET", None, token)
            except:
                pass
        
        # 6. Test Workout endpoints - List
        test_endpoint("/health/workout/", "GET", None, token)
        
        # 7. Test Workout endpoints - Create
        workout_data = {
            "workout_name": "Morning Cardio",
            "workout_type": "Cardio",
            "duration": 30,
            "calories_burned": 250,
            "intensity": "moderate",
            "date": today,
            "description": "30 minutes of running and stretching"
        }
        response = test_endpoint("/health/workout/", "POST", workout_data, token)
        
        # 8. Test Marathon endpoints - List
        test_endpoint("/health/marathon/", "GET", None, token)
        
        # 9. Test Marathon endpoints - Create
        marathon_data = {
            "marathon_name": "City Marathon 2026",
            "distance": 42.2,
            "target_date": "2026-10-15",
            "status": "planning",
            "location": "New York City",
            "notes": "First full marathon attempt"
        }
        response = test_endpoint("/health/marathon/", "POST", marathon_data, token)
        
    else:
        print("\n" + "="*60)
        print("Testing without authentication (public endpoints)...")
        print("="*60)
        
        # Test public endpoints (if any)
        # Most endpoints require authentication
    
    print("\n" + "="*60)
    print("Summary of endpoints to test:")
    print("="*60)
    print("""
1. Water Intake:
   - POST /api/health/water-intake/
   - GET /api/health/water-intake/get/?date={date}
   - GET /api/health/water-intake/get/?days=7

2. Diet:
   - GET /api/health/diet/
   - POST /api/health/diet/
   - GET/PUT/DELETE /api/health/diet/{id}/

3. Workout:
   - GET /api/health/workout/
   - POST /api/health/workout/
   - GET/PUT/DELETE /api/health/workout/{id}/

4. Marathon:
   - GET /api/health/marathon/
   - POST /api/health/marathon/
   - GET/PUT/DELETE /api/health/marathon/{id}/

5. Health Data:
   - GET /api/health/health-data/?days=7
   - GET /api/health/heart-rate/
   - GET /api/health/sleep/
   - POST /api/health/sync/
   - GET /api/health/analytics/
    """)

if __name__ == "__main__":
    main()