from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from datetime import date, timedelta
from django.utils.timezone import now
import json

from .models import MealPlan, MealItem, MealItemTracking
from .ai_meal_planner import generate_meal_plan, generate_meal_image


# ---------------- CALORIE CALCULATION ---------------- #
def recommended_calories(age, gender, height, weight, activity):
    if gender.lower() == 'male':
        bmr = 88.36 + (13.4 * weight) + (4.8 * height) - (5.7 * age)
    else:
        bmr = 447.6 + (9.2 * weight) + (3.1 * height) - (4.3 * age)

    activity_map = {
        'sedentary': 1.2,
        'light': 1.375,
        'moderate': 1.55,
        'active': 1.725,
        'very_active': 1.9
    }
    return int(bmr * activity_map.get(activity.lower(), 1.2))


# ---------------- NUTRITION FEEDBACK FOR AI ---------------- #
def get_feedback(user):
    last_week = now().date() - timedelta(days=7)
    meals = MealPlan.objects.filter(user=user, date__gte=last_week)

    protein = carbs = fat = calories = 0

    for meal in meals:
        for item in meal.items.all():
            tracking = MealItemTracking.objects.filter(meal_item=item).order_by('-timestamp').first()
            if tracking and tracking.status == "eaten":
                ratio = tracking.quantity_ratio
                calories += item.calories * ratio
                protein += item.protein * ratio
                carbs += item.carbs * ratio
                fat += item.fat * ratio

    return {
        "calories": round(calories, 1),
        "protein": round(protein, 1),
        "carbs": round(carbs, 1),
        "fat": round(fat, 1),
    }


# ---------------- GENERATE AI MEAL PLAN ---------------- #
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_ai_meal_plan(request):
    user = request.user

    # Get user data from User model
    if not user.height or not user.weight or not user.date_of_birth or not user.gender:
        return Response({"error": "Please complete your profile with height, weight, date of birth, and gender"}, status=400)

    # Calculate age from date of birth
    from datetime import date
    today = date.today()
    age = today.year - user.date_of_birth.year - ((today.month, today.day) < (user.date_of_birth.month, user.date_of_birth.day))

    calories = recommended_calories(
        age,
        user.gender,
        user.height,
        user.weight,
        request.data.get("activity", "moderate")
    )

    feedback = get_feedback(user)

    # Use user's fitness goal from profile if not provided in request
    goal = request.data.get("goal")
    if not goal and user.fitness_goal:
        goal = user.fitness_goal
    elif not goal:
        goal = "maintain"  # Default fallback

    days = request.data.get("days", 7)
    
    # Check if user has an active meal plan
    future_meals = MealPlan.objects.filter(user=user, date__gte=today).count()
    
    if future_meals > 0:
        # User has an active plan
        force_new = request.data.get("force_new", False)
        
        if not force_new:
            # Return info about existing plan
            return Response({
                "error": "active_plan_exists",
                "message": f"You have an active meal plan with {future_meals} upcoming meals. Set 'force_new' to true to replace it.",
                "active_meals_count": future_meals
            }, status=400)
        else:
            # User wants to replace the current plan - delete all future meals
            MealPlan.objects.filter(user=user, date__gte=today).delete()

    # Use real AI meal planner with Gemini
    plan = generate_meal_plan(
        calories,
        request.data.get("diet_type", "none"),
        request.data.get("allergies", ""),
        goal,
        days,
        feedback=feedback
    )

    # Generate meal plan starting from today
    for d in range(days):
        day_date = today + timedelta(days=d)
        for meal_type, items in plan[str(d+1)].items():
            meal = MealPlan.objects.create(user=user, date=day_date, meal_type=meal_type)

            for food in items:
                MealItem.objects.create(
                    meal=meal,
                    food_name=food["name"],
                    calories=food["calories"],
                    protein=food["protein"],
                    carbs=food["carbs"],
                    fat=food["fat"]
                )

    return Response({
        "success": True,
        "message": "Meal plan generated successfully",
        "days": days,
        "start_date": str(today),
        "end_date": str(today + timedelta(days=days-1))
    })
    

# ---------------- TRACK MEAL ITEM ---------------- #
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def track_meal_item(request):
    meal_item_id = request.data.get("meal_item_id")
    status_val = request.data.get("status")
    quantity_ratio = request.data.get("quantity_ratio")

    try:
        meal_item = MealItem.objects.get(id=meal_item_id)
    except MealItem.DoesNotExist:
        return Response({"error": "Meal item not found"}, status=404)

    MealItemTracking.objects.create(
        meal_item=meal_item,
        status=status_val,
        quantity_ratio=quantity_ratio
    )

    return Response({"message": "Meal tracking saved"})
    

# ---------------- GET MEAL PLAN FOR DATE ---------------- #
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_meal_plan(request):
    """Get user's meal plan for a specific date"""
    user = request.user
    date_str = request.GET.get('date', str(date.today()))
    
    try:
        plan_date = date.fromisoformat(date_str)
    except ValueError:
        plan_date = date.today()
    
    meals = MealPlan.objects.filter(user=user, date=plan_date)
    
    if not meals.exists():
        return Response({
            'success': False,
            'message': 'No meal plan found for this date'
        }, status=404)
    
    result = {}
    for meal in meals:
        items = []
        total_calories = 0
        
        for item in meal.items.all():
            tracking = MealItemTracking.objects.filter(meal_item=item).order_by('-timestamp').first()
            
            items.append({
                'id': item.id,
                'name': item.food_name,
                'calories': item.calories,
                'protein': item.protein,
                'carbs': item.carbs,
                'fat': item.fat,
                'image_url': item.image_url,
                'tracked': tracking is not None,
                'status': tracking.status if tracking else None,
                'quantity_ratio': tracking.quantity_ratio if tracking else 1.0
            })
            
            total_calories += item.calories
        
        result[meal.meal_type] = {
            'items': items,
            'total_calories': round(total_calories, 1)
        }
    
    return Response({
        'success': True,
        'date': date_str,
        'meals': result
    })


# ---------------- DAILY NUTRITION SUMMARY ---------------- #
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def daily_nutrition(request):
    user = request.user
    today = date.today()

    meals = MealPlan.objects.filter(user=user, date=today)

    total_calories = total_protein = total_carbs = total_fat = 0

    for meal in meals:
        for item in meal.items.all():
            tracking = MealItemTracking.objects.filter(meal_item=item).order_by('-timestamp').first()

            if tracking and tracking.status == "eaten":
                ratio = tracking.quantity_ratio
                total_calories += item.calories * ratio
                total_protein += item.protein * ratio
                total_carbs += item.carbs * ratio
                total_fat += item.fat * ratio

    return Response({
        "calories": round(total_calories, 1),
        "protein": round(total_protein, 1),
        "carbs": round(total_carbs, 1),
        "fat": round(total_fat, 1)
    })


# ---------------- CHECK ACTIVE MEAL PLAN ---------------- #
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def check_active_plan(request):
    """Check if user has an active meal plan"""
    user = request.user
    today = date.today()
    
    # Count future meals (including today)
    future_meals = MealPlan.objects.filter(user=user, date__gte=today)
    
    if future_meals.exists():
        # Get date range
        first_meal = future_meals.order_by('date').first()
        last_meal = future_meals.order_by('-date').first()
        
        total_days = (last_meal.date - first_meal.date).days + 1
        remaining_days = (last_meal.date - today).days + 1
        
        return Response({
            "has_active_plan": True,
            "start_date": str(first_meal.date),
            "end_date": str(last_meal.date),
            "total_days": total_days,
            "remaining_days": remaining_days,
            "total_meals": future_meals.count()
        })
    else:
        return Response({
            "has_active_plan": False,
            "message": "No active meal plan found"
        })


# ---------------- GENERATE MEAL IMAGE ---------------- #
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_meal_image_endpoint(request):
    """Generate an image for a specific meal item"""
    meal_item_id = request.data.get("meal_item_id")
    
    try:
        meal_item = MealItem.objects.get(id=meal_item_id)
    except MealItem.DoesNotExist:
        return Response({"error": "Meal item not found"}, status=404)
    
    # Check if image already exists
    if meal_item.image_url:
        return Response({
            "success": True,
            "image_url": meal_item.image_url,
            "cached": True
        })
    
    # Generate new image
    meal_type = meal_item.meal.meal_type
    image_data = generate_meal_image(meal_item.food_name, meal_type)
    
    if image_data:
        # Store as base64
        import base64
        image_base64 = base64.b64encode(image_data).decode('utf-8')
        meal_item.image_url = f"data:image/png;base64,{image_base64}"
        meal_item.save()
        
        return Response({
            "success": True,
            "image_url": meal_item.image_url,
            "cached": False
        })
    else:
        return Response({
            "success": False,
            "error": "Failed to generate image"
        }, status=500)


# ---------------- RECALCULATE MEAL PLAN BASED ON ACTUAL INTAKE ---------------- #
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def recalculate_meal_plan(request):
    """
    Recalculate remaining meal plan based on what user actually ate
    This provides smart AI adjustments based on user's eating patterns
    """
    from .ai_meal_planner import recalculate_meal_plan as ai_recalculate
    
    user = request.user
    today = date.today()
    
    # Get user's eating data from the last 7 days
    last_week = today - timedelta(days=7)
    meals = MealPlan.objects.filter(user=user, date__gte=last_week, date__lt=today)
    
    total_calories = total_protein = total_carbs = total_fat = 0
    days_with_data = set()
    
    for meal in meals:
        days_with_data.add(meal.date)
        for item in meal.items.all():
            tracking = MealItemTracking.objects.filter(meal_item=item).order_by('-timestamp').first()
            if tracking and tracking.status == "eaten":
                ratio = tracking.quantity_ratio
                total_calories += item.calories * ratio
                total_protein += item.protein * ratio
                total_carbs += item.carbs * ratio
                total_fat += item.fat * ratio
    
    days_tracked = len(days_with_data)
    
    if days_tracked == 0:
        return Response({
            "error": "No eating data found in the last 7 days. Please track your meals first."
        }, status=400)
    
    # Calculate user's target calories
    if not user.height or not user.weight or not user.date_of_birth or not user.gender:
        return Response({
            "error": "Please complete your profile with height, weight, date of birth, and gender"
        }, status=400)
    
    from datetime import date as dt
    age = dt.today().year - user.date_of_birth.year
    target_calories = recommended_calories(
        age,
        user.gender,
        user.height,
        user.weight,
        request.data.get("activity", "moderate")
    )
    
    # Prepare intake data
    user_intake_data = {
        'total_calories': total_calories,
        'total_protein': total_protein,
        'total_carbs': total_carbs,
        'total_fat': total_fat,
        'days_tracked': days_tracked,
        'deficit_or_surplus': (target_calories * days_tracked) - total_calories
    }
    
    # Get remaining days in current plan
    future_meals = MealPlan.objects.filter(user=user, date__gte=today)
    if not future_meals.exists():
        return Response({
            "error": "No active meal plan found. Please generate a new meal plan first."
        }, status=400)
    
    # Count unique future dates
    future_dates = future_meals.values_list('date', flat=True).distinct()
    remaining_days = len(future_dates)
    
    # Delete future meals (we'll replace them with recalculated ones)
    MealPlan.objects.filter(user=user, date__gte=today).delete()
    
    # Get recalculated plan from AI
    result = ai_recalculate(
        user_intake_data=user_intake_data,
        target_calories=target_calories,
        diet_type=request.data.get("diet_type", "none"),
        allergies=request.data.get("allergies", ""),
        goal=user.fitness_goal or "maintain",
        remaining_days=remaining_days
    )
    
    # Save the new recalculated plan
    plan = result['meal_plan']
    for d in range(remaining_days):
        day_date = today + timedelta(days=d)
        for meal_type, items in plan[str(d+1)].items():
            meal = MealPlan.objects.create(user=user, date=day_date, meal_type=meal_type)
            
            for food in items:
                MealItem.objects.create(
                    meal=meal,
                    food_name=food["name"],
                    calories=food["calories"],
                    protein=food["protein"],
                    carbs=food["carbs"],
                    fat=food["fat"]
                )
    
    return Response({
        "success": True,
        "message": "Meal plan recalculated based on your eating patterns",
        "adjustment_note": result['adjustment_note'],
        "adjusted_calories": result['adjusted_calories'],
        "original_target": result['original_target'],
        "days_recalculated": remaining_days,
        "your_avg_daily_intake": round(total_calories / days_tracked, 1),
        "days_analyzed": days_tracked
    })


# ---------------- AI WORKOUT PLANNER ---------------- #
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_ai_workout_plan(request):
    """Generate personalized AI workout plan and store in database"""
    from google import genai
    import os
    import json
    from health_data.models import Workout
    from datetime import date as dt
    
    user = request.user
    
    # Validate user profile
    if not user.height or not user.weight or not user.date_of_birth or not user.gender:
        return Response({
            "error": "Please complete your profile with height, weight, date of birth, and gender"
        }, status=400)
    
    # Calculate age and BMI
    today = dt.today()
    age = request.data.get("age") or (today.year - user.date_of_birth.year - ((today.month, today.day) < (user.date_of_birth.month, user.date_of_birth.day)))
    weight = request.data.get("weight", user.weight)
    height = request.data.get("height", user.height)
    
    height_m = height / 100
    bmi = weight / (height_m * height_m)
    
    # Get fitness level and goal
    fitness_level = request.data.get("fitness_level", "intermediate")
    goal = request.data.get("goal") or user.fitness_goal or "general_fitness"
    duration = request.data.get("duration", "7_days")  # 7_days, 1_month, 3_months
    
    # Map duration to days
    duration_map = {
        "7_days": 7,
        "1_month": 30,
        "3_months": 90
    }
    num_days = duration_map.get(duration, 7)
    
    # Get health data from request (from Health Connect or defaults)
    avg_steps = request.data.get("avg_steps", 5000)
    sleep_hours = request.data.get("sleep_hours", 7)
    spo2 = request.data.get("spo2", 98)
    
    # Configure Gemini with new API
    client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))
    
    # Create enhanced prompt with health data
    prompt = f"""Generate a {num_days}-day personalized workout plan in JSON format for:
    
User Profile:
- Age: {age}
- Gender: {user.gender}
- Weight: {weight} kg
- Height: {height} cm
- BMI: {bmi:.1f}
- Fitness Level: {fitness_level}
- Goal: {goal}

Health Data:
- Average Daily Steps: {avg_steps}
- Average Sleep: {sleep_hours} hours
- SpO2 Level: {spo2}%

Requirements:
1. Create a {num_days}-day workout program with variety
2. Each day should have 6-8 exercises with specific workout types
3. Include workout type for each exercise (cardio, strength, flexibility, hiit, yoga, core)
4. Consider their activity level (steps) when designing intensity
5. Include rest days appropriately (1-2 per week)
6. Mix different workout types throughout the week
7. Provide specific reps/duration for each exercise
8. Calculate total workout duration and estimated calories burned for each day
9. Progress difficulty gradually over the {num_days} days

Return ONLY valid JSON in this exact format (NO markdown, NO backticks):
{{
    "plan_title": "Personalized {num_days}-Day Workout Plan",
    "total_days": {num_days},
    "days": [
        {{
            "day_number": 1,
            "day_name": "Day 1 - Full Body",
            "is_rest_day": false,
            "total_duration_minutes": 45,
            "total_calories": 350,
            "exercises": [
                {{
                    "name": "Exercise name",
                    "workout_type": "cardio",
                    "reps_or_duration": "3 sets of 12 reps" or "5 minutes",
                    "calories": 50
                }}
            ]
        }}
    ]
}}"""
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        response_text = response.text.strip()
        
        # Extract JSON from response
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        workout_plan = json.loads(response_text)
        
        # Store in database - store the entire multi-day plan
        workout = Workout.objects.create(
            user=user,
            workout_name=workout_plan.get('plan_title', f'{num_days}-Day Workout Plan'),
            workout_type='AI Generated',
            duration=num_days,  # Store number of days
            calories_burned=sum([day.get('total_calories', 0) for day in workout_plan.get('days', [])]),
            intensity='moderate',
            date=today,
            description=json.dumps(workout_plan.get('days', []))  # Store all days
        )
        
        return Response({
            "success": True,
            "workout_plan": workout_plan,
            "workout_id": workout.id
        })
        
    except Exception as e:
        return Response({
            "error": f"Failed to generate workout plan: {str(e)}"
        }, status=500)


# ---------------- AI MARATHON TRAINING PLANNER ---------------- #
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_ai_marathon_plan(request):
    """Generate personalized AI marathon training plan and store in database"""
    from google import genai
    import os
    import json
    from health_data.models import Marathon
    from datetime import date as dt, timedelta, datetime
    
    user = request.user
    
    # Validate user profile
    if not user.height or not user.weight or not user.date_of_birth or not user.gender:
        return Response({
            "error": "Please complete your profile with height, weight, date of birth, and gender"
        }, status=400)
    
    # Calculate age and BMI
    today = dt.today()
    age = request.data.get("age") or (today.year - user.date_of_birth.year - ((today.month, today.day) < (user.date_of_birth.month, user.date_of_birth.day)))
    
    height_m = user.height / 100
    bmi = user.weight / (height_m * height_m)
    
    # Get training parameters
    experience_level = request.data.get("experience_level", "beginner")
    target_distance = request.data.get("target_distance", "half_marathon")  # half_marathon, full_marathon, 10k
    
    # Get health data from request (from Health Connect or defaults)
    avg_steps = request.data.get("avg_steps", 5000)
    spo2 = request.data.get("spo2", 98)
    resting_heart_rate = request.data.get("resting_heart_rate", 70)
    sleep_hours = request.data.get("sleep_hours", 7)
    goal_time_hours = request.data.get("goal_time_hours", 4)
    
    # Get marathon date
    marathon_date_str = request.data.get("marathon_date")
    if marathon_date_str:
        try:
            target_date = datetime.strptime(marathon_date_str, "%Y-%m-%d").date()
        except:
            target_date = today + timedelta(days=90)
    else:
        target_date = today + timedelta(days=90)
    
    weeks_until_marathon = max(1, (target_date - today).days // 7)
    
    # Configure Gemini with new API
    client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))
    
    # Create enhanced prompt with health data
    prompt = f"""Generate a personalized weekly marathon training plan in JSON format for:
    
User Profile:
- Age: {age}
- Gender: {user.gender}
- Weight: {user.weight} kg
- Height: {user.height} cm
- BMI: {bmi:.1f}
- Experience Level: {experience_level}
- Target: {target_distance}

Health Data:
- Average Daily Steps: {avg_steps}
- SpO2 Level: {spo2}%
- Resting Heart Rate: {resting_heart_rate} BPM
- Average Sleep: {sleep_hours} hours

Training Goals:
- Goal Time: {goal_time_hours} hours
- Marathon Date: {target_date}
- Weeks Until Marathon: {weeks_until_marathon}

Requirements:
1. Create a 7-day weekly training schedule appropriate for Week 1
2. Consider their current fitness level (steps, heart rate) when designing intensity
3. Include different run types (easy run, tempo run, long run, rest day, cross-training)
4. Provide specific distances for each run based on their experience level
5. Calculate weekly mileage and estimated calories burned
6. Balance training with recovery considering their sleep patterns
7. Design the plan to help them achieve their goal time

Return ONLY valid JSON in this exact format (NO markdown, NO backticks):
{{
    "plan_title": "Marathon Training Plan - Week 1",
    "weekly_mileage_km": 35,
    "workouts_per_week": 5,
    "estimated_weekly_calories": 2500,
    "weekly_schedule": [
        {{
            "day": "Monday",
            "run_type": "Easy Run",
            "distance_km": 5,
            "notes": "Comfortable pace"
        }},
        {{
            "day": "Tuesday",
            "run_type": "Rest Day",
            "distance_km": 0,
            "notes": "Recovery and stretching"
        }}
    ]
}}"""
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        response_text = response.text.strip()
        
        # Extract JSON from response
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        marathon_plan = json.loads(response_text)
        
        # Store in database
        marathon = Marathon.objects.create(
            user=user,
            marathon_name=marathon_plan.get('plan_title', 'AI Marathon Plan'),
            distance=marathon_plan.get('weekly_mileage_km', 0),
            target_date=target_date,
            status='training',
            notes=json.dumps(marathon_plan.get('weekly_schedule', []))
        )
        
        return Response({
            "success": True,
            "marathon_plan": marathon_plan,
            "marathon_id": marathon.id
        })
        
    except Exception as e:
        return Response({
            "error": f"Failed to generate marathon plan: {str(e)}"
        }, status=500)


# ---------------- GET USER'S WORKOUT PLANS ---------------- #
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user_workout_plans(request):
    """Get all workout plans for the user"""
    from health_data.models import Workout
    
    user = request.user
    workouts = Workout.objects.filter(user=user).order_by('-created_at')[:10]
    
    plans = []
    for workout in workouts:
        try:
            exercises = json.loads(workout.description) if workout.description else []
        except:
            exercises = []
        
        plans.append({
            'id': workout.id,
            'workout_name': workout.workout_name,
            'duration': workout.duration,
            'calories_burned': workout.calories_burned,
            'date': str(workout.date),
            'exercises': exercises
        })
    
    return Response({
        'success': True,
        'workout_plans': plans
    })


# ---------------- GET USER'S MARATHON PLANS ---------------- #
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user_marathon_plans(request):
    """Get all marathon plans for the user"""
    from health_data.models import Marathon
    
    user = request.user
    marathons = Marathon.objects.filter(user=user).order_by('-created_at')[:10]
    
    plans = []
    for marathon in marathons:
        try:
            schedule = json.loads(marathon.notes) if marathon.notes else []
        except:
            schedule = []
        
        plans.append({
            'id': marathon.id,
            'marathon_name': marathon.marathon_name,
            'distance': marathon.distance,
            'target_date': str(marathon.target_date),
            'status': marathon.status,
            'schedule': schedule
        })
    
    return Response({
        'success': True,
        'marathon_plans': plans
    })


# ---------------- REGENERATE WORKOUT PLAN BASED ON USER BEHAVIOR ---------------- #
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def regenerate_workout_plan(request):
    """Regenerate workout plan based on user's workout history and behavior"""
    from health_data.models import Workout
    from datetime import timedelta, date as dt
    from google import genai
    import os
    import json
    
    user = request.user
    today = dt.today()
    last_30_days = today - timedelta(days=30)
    
    # Get user's workout history from Workout table (completed AI workouts)
    completed_workouts = Workout.objects.filter(
        user=user,
        workout_type='AI Generated',
        date__gte=last_30_days
    )
    
    # Analyze user behavior from completed workouts
    total_workouts = completed_workouts.count()
    total_calories = sum([w.calories_burned for w in completed_workouts])
    avg_duration = sum([w.duration for w in completed_workouts]) / total_workouts if total_workouts > 0 else 0
    
    # Calculate age and BMI
    age = today.year - user.date_of_birth.year
    height_m = user.height / 100
    bmi = user.weight / (height_m * height_m)
    
    # Configure Gemini with new API
    client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))
    
    # Create adaptive prompt
    prompt = f"""Generate an ADAPTIVE workout plan based on user's actual behavior:

User Profile:
- Age: {age}, Gender: {user.gender}
- Weight: {user.weight} kg, Height: {user.height} cm, BMI: {bmi:.1f}
- Goal: {user.fitness_goal or 'general_fitness'}

User's Last 30 Days Activity:
- Total Workouts Completed: {total_workouts}
- Total Calories Burned: {total_calories}
- Average Workout Duration: {avg_duration:.0f} minutes

ADAPT the plan to:
1. Match their actual workout frequency
2. Progress gradually from their current level
3. Challenge them appropriately based on their consistency

Return ONLY valid JSON (NO markdown):
{{
    "plan_title": "Adaptive Workout Plan",
    "total_duration_minutes": 45,
    "total_calories": 350,
    "exercise_count": 8,
    "adaptation_note": "Brief note on how this plan adapts to their behavior",
    "exercises": [
        {{"name": "Exercise", "workout_type": "cardio", "reps_or_duration": "3x12", "calories": 50}}
    ]
}}"""
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        response_text = response.text.strip().replace("```json", "").replace("```", "").strip()
        workout_plan = json.loads(response_text)
        
        # Store in database
        workout = Workout.objects.create(
            user=user,
            workout_name=workout_plan.get('plan_title', 'Adaptive Workout Plan'),
            workout_type='AI Adaptive',
            duration=workout_plan.get('total_duration_minutes', 0),
            calories_burned=workout_plan.get('total_calories', 0),
            intensity='moderate',
            date=today,
            description=json.dumps(workout_plan.get('exercises', []))
        )
        
        return Response({
            "success": True,
            "workout_plan": workout_plan,
            "workout_id": workout.id,
            "user_stats": {
                "total_workouts_last_30_days": total_workouts,
                "avg_duration": round(avg_duration, 1)
            }
        })
        
    except Exception as e:
        return Response({
            "error": f"Failed to regenerate workout plan: {str(e)}"
        }, status=500)


# ---------------- DELETE CURRENT MEAL PLAN ---------------- #
@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_current_meal_plan(request):
    """Delete all future meal plans for the user (including today)"""
    user = request.user
    today = date.today()
    
    # Get count of meals to be deleted
    future_meals = MealPlan.objects.filter(user=user, date__gte=today)
    meal_count = future_meals.count()
    
    if meal_count == 0:
        return Response({
            "success": False,
            "message": "No active meal plan found"
        }, status=404)
    
    # Get date range for info
    first_meal = future_meals.order_by('date').first()
    last_meal = future_meals.order_by('-date').first()
    
    # Delete all future meals
    future_meals.delete()
    
    return Response({
        "success": True,
        "message": f"Meal plan deleted successfully",
        "deleted_meals": meal_count,
        "date_range": {
            "start": str(first_meal.date),
            "end": str(last_meal.date)
        }
    })


# ---------------- GET ACTIVE WORKOUT PLAN ---------------- #
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_active_workout_plan(request):
    """Get the most recent workout plan with tracking status"""
    from health_data.models import Workout
    from .models import WorkoutExerciseTracking
    
    user = request.user
    
    # Get the most recent workout plan (any type)
    workout = Workout.objects.filter(user=user).exclude(workout_type='Daily Progressive').order_by('-created_at').first()
    
    if not workout:
        return Response({
            'has_active_plan': False,
            'message': 'No workout plan found'
        })
    
    # Parse days from description (new multi-day format)
    try:
        days = json.loads(workout.description) if workout.description else []
        
        # Check if it's the new multi-day format
        if days and isinstance(days, list) and len(days) > 0 and 'day_number' in days[0]:
            # Multi-day format
            days_with_tracking = []
            total_exercises = 0
            completed_exercises = 0
            
            for day in days:
                day_exercises = []
                for idx, exercise in enumerate(day.get('exercises', [])):
                    exercise_global_index = total_exercises + idx
                    tracking = WorkoutExerciseTracking.objects.filter(
                        workout=workout, 
                        exercise_index=exercise_global_index
                    ).first()
                    
                    day_exercises.append({
                        'index': exercise_global_index,
                        'name': exercise.get('name', ''),
                        'workout_type': exercise.get('workout_type', 'general'),
                        'reps_or_duration': exercise.get('reps_or_duration', ''),
                        'calories': exercise.get('calories', 0),
                        'completed': tracking.completed if tracking else False,
                        'difficulty': tracking.difficulty if tracking else None
                    })
                    
                    if tracking and tracking.completed:
                        completed_exercises += 1
                
                total_exercises += len(day.get('exercises', []))
                
                days_with_tracking.append({
                    'day_number': day.get('day_number', 0),
                    'day_name': day.get('day_name', ''),
                    'is_rest_day': day.get('is_rest_day', False),
                    'total_duration_minutes': day.get('total_duration_minutes', 0),
                    'total_calories': day.get('total_calories', 0),
                    'exercises': day_exercises
                })
            
            all_completed = completed_exercises == total_exercises
            
            return Response({
                'has_active_plan': True,
                'workout_id': workout.id,
                'workout_name': workout.workout_name,
                'is_multi_day': True,
                'total_days': len(days),
                'days': days_with_tracking,
                'all_completed': all_completed,
                'progress': {
                    'completed': completed_exercises,
                    'total': total_exercises
                },
                'created_at': workout.created_at
            })
        else:
            # Old single-day format (backward compatibility)
            exercises = days  # In old format, it's just exercises array
            exercises_with_tracking = []
            for idx, exercise in enumerate(exercises):
                tracking = WorkoutExerciseTracking.objects.filter(workout=workout, exercise_index=idx).first()
                exercises_with_tracking.append({
                    'index': idx,
                    'name': exercise.get('name', ''),
                    'workout_type': exercise.get('workout_type', 'general'),
                    'reps_or_duration': exercise.get('reps_or_duration', ''),
                    'calories': exercise.get('calories', 0),
                    'completed': tracking.completed if tracking else False,
                    'difficulty': tracking.difficulty if tracking else None
                })
            
            all_completed = all(e['completed'] for e in exercises_with_tracking)
            
            return Response({
                'has_active_plan': True,
                'workout_id': workout.id,
                'workout_name': workout.workout_name,
                'is_multi_day': False,
                'total_duration': workout.duration,
                'total_calories': workout.calories_burned,
                'exercises': exercises_with_tracking,
                'all_completed': all_completed,
                'created_at': workout.created_at
            })
    except Exception as e:
        return Response({
            'has_active_plan': False,
            'error': str(e)
        }, status=500)


# ---------------- TRACK WORKOUT EXERCISE ---------------- #
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def track_workout_exercise(request):
    """Mark a workout exercise as completed and log calories"""
    from health_data.models import Workout, HealthData
    from .models import WorkoutExerciseTracking
    from django.utils import timezone
    from datetime import date as dt
    
    workout_id = request.data.get('workout_id')
    exercise_index = request.data.get('exercise_index')
    completed = request.data.get('completed', True)
    
    try:
        workout = Workout.objects.get(id=workout_id, user=request.user)
    except Workout.DoesNotExist:
        return Response({'error': 'Workout not found'}, status=404)
    
    # Create or update tracking
    tracking, created = WorkoutExerciseTracking.objects.get_or_create(
        workout=workout,
        exercise_index=exercise_index,
        defaults={'completed': completed, 'completed_at': timezone.now() if completed else None}
    )
    
    if not created:
        tracking.completed = completed
        tracking.completed_at = timezone.now() if completed else None
        tracking.save()
    
    # Log calories to daily progress if completed
    if completed:
        try:
            days = json.loads(workout.description) if workout.description else []
            
            # Find the exercise and its calories
            exercise_calories = 0
            if days and isinstance(days, list) and len(days) > 0 and 'day_number' in days[0]:
                # Multi-day format
                for day in days:
                    for ex in day.get('exercises', []):
                        # Match by global index (we need to calculate it)
                        pass  # Will calculate below
            
            # For now, get calories from the exercise data
            # We'll need to parse the workout structure to find the exact exercise
            today = dt.today()
            health_data, _ = HealthData.objects.get_or_create(
                user=request.user,
                date=today,
                defaults={'steps': 0, 'calories_burned': 0, 'distance': 0, 'active_minutes': 0}
            )
            
            # Parse workout to find exercise calories
            if days and isinstance(days, list):
                if len(days) > 0 and 'day_number' in days[0]:
                    # Multi-day format - find exercise by index
                    current_index = 0
                    for day in days:
                        for ex in day.get('exercises', []):
                            if current_index == exercise_index:
                                exercise_calories = ex.get('calories', 0)
                                break
                            current_index += 1
                        if exercise_calories > 0:
                            break
                else:
                    # Single day format
                    if exercise_index < len(days):
                        exercise_calories = days[exercise_index].get('calories', 0)
            
            if exercise_calories > 0:
                health_data.calories_burned += exercise_calories
                health_data.save()
        except Exception as e:
            pass  # Don't fail the tracking if calorie logging fails
    
    # Check if all exercises are completed
    try:
        exercises = json.loads(workout.description) if workout.description else []
        if exercises and isinstance(exercises, list) and len(exercises) > 0 and 'day_number' in exercises[0]:
            # Multi-day format
            total_exercises = sum(len(day.get('exercises', [])) for day in exercises)
        else:
            total_exercises = len(exercises)
        completed_count = WorkoutExerciseTracking.objects.filter(workout=workout, completed=True).count()
        all_completed = completed_count == total_exercises
    except:
        all_completed = False
    
    return Response({
        'success': True,
        'completed': tracking.completed,
        'all_completed': all_completed
    })


# ---------------- COMPLETE WORKOUT PLAN ---------------- #
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def complete_workout_plan(request):
    """Called when all exercises are completed - ask for feedback and regenerate"""
    from health_data.models import Workout
    from .models import WorkoutExerciseTracking
    
    workout_id = request.data.get('workout_id')
    overall_difficulty = request.data.get('difficulty')  # easy, just_right, difficult
    preference = request.data.get('preference')  # easier, same, harder
    
    try:
        workout = Workout.objects.get(id=workout_id, user=request.user)
    except Workout.DoesNotExist:
        return Response({'error': 'Workout not found'}, status=404)
    
    # Update all tracking with difficulty feedback
    WorkoutExerciseTracking.objects.filter(workout=workout).update(difficulty=overall_difficulty)
    
    return Response({
        'success': True,
        'message': 'Workout completed! Feedback recorded.',
        'should_regenerate': True,
        'feedback': {
            'difficulty': overall_difficulty,
            'preference': preference
        }
    })


# ---------------- GET ACTIVE MARATHON PLAN ---------------- #
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_active_marathon_plan(request):
    """Get the most recent marathon plan with tracking status"""
    from health_data.models import Marathon
    from .models import MarathonDayTracking
    
    user = request.user
    
    # Get the most recent marathon plan (any status)
    marathon = Marathon.objects.filter(user=user).order_by('-created_at').first()
    
    if not marathon:
        return Response({
            'has_active_plan': False,
            'message': 'No marathon plan found'
        })
    
    # Parse schedule from notes
    try:
        schedule = json.loads(marathon.notes) if marathon.notes else []
    except:
        schedule = []
    
    # Get tracking status for each day
    days_with_tracking = []
    for idx, day in enumerate(schedule):
        tracking = MarathonDayTracking.objects.filter(marathon=marathon, day_index=idx).first()
        days_with_tracking.append({
            'index': idx,
            'day': day.get('day', ''),
            'run_type': day.get('run_type', ''),
            'distance_km': day.get('distance_km', 0),
            'notes': day.get('notes', ''),
            'completed': tracking.completed if tracking else False,
            'difficulty': tracking.difficulty if tracking else None
        })
    
    # Check if all days are completed
    all_completed = all(d['completed'] for d in days_with_tracking)
    
    return Response({
        'has_active_plan': True,
        'marathon_id': marathon.id,
        'marathon_name': marathon.marathon_name,
        'weekly_mileage': marathon.distance,
        'target_date': str(marathon.target_date),
        'schedule': days_with_tracking,
        'all_completed': all_completed,
        'created_at': marathon.created_at
    })


# ---------------- TRACK MARATHON DAY ---------------- #
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def track_marathon_day(request):
    """Mark a marathon training day as completed and log calories/distance"""
    from health_data.models import Marathon, HealthData
    from .models import MarathonDayTracking
    from django.utils import timezone
    from datetime import date as dt
    
    marathon_id = request.data.get('marathon_id')
    day_index = request.data.get('day_index')
    completed = request.data.get('completed', True)
    
    try:
        marathon = Marathon.objects.get(id=marathon_id, user=request.user)
    except Marathon.DoesNotExist:
        return Response({'error': 'Marathon plan not found'}, status=404)
    
    # Create or update tracking
    tracking, created = MarathonDayTracking.objects.get_or_create(
        marathon=marathon,
        day_index=day_index,
        defaults={'completed': completed, 'completed_at': timezone.now() if completed else None}
    )
    
    if not created:
        tracking.completed = completed
        tracking.completed_at = timezone.now() if completed else None
        tracking.save()
    
    # Log calories and distance to daily progress if completed
    if completed:
        try:
            schedule = json.loads(marathon.notes) if marathon.notes else []
            
            if day_index < len(schedule):
                day_data = schedule[day_index]
                distance_km = day_data.get('distance_km', 0)
                
                # Estimate calories burned from running (rough estimate: 60 cal per km)
                estimated_calories = int(distance_km * 60)
                
                # Estimate duration (rough estimate: 6 min per km for average pace)
                estimated_duration = int(distance_km * 6)
                
                today = dt.today()
                health_data, _ = HealthData.objects.get_or_create(
                    user=request.user,
                    date=today,
                    defaults={'steps': 0, 'calories_burned': 0, 'distance': 0, 'active_minutes': 0}
                )
                
                health_data.calories_burned += estimated_calories
                health_data.distance += distance_km
                health_data.active_minutes += estimated_duration
                health_data.save()
        except Exception as e:
            pass  # Don't fail the tracking if calorie logging fails
    
    # Check if all days are completed
    try:
        schedule = json.loads(marathon.notes) if marathon.notes else []
        total_days = len(schedule)
        completed_count = MarathonDayTracking.objects.filter(marathon=marathon, completed=True).count()
        all_completed = completed_count == total_days
    except:
        all_completed = False
    
    return Response({
        'success': True,
        'completed': tracking.completed,
        'all_completed': all_completed
    })


# ---------------- COMPLETE MARATHON WEEK ---------------- #
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def complete_marathon_week(request):
    """Called when all training days are completed - ask for feedback and regenerate"""
    from health_data.models import Marathon
    from .models import MarathonDayTracking
    
    marathon_id = request.data.get('marathon_id')
    overall_difficulty = request.data.get('difficulty')  # easy, just_right, difficult
    preference = request.data.get('preference')  # easier, same, harder
    
    try:
        marathon = Marathon.objects.get(id=marathon_id, user=request.user)
    except Marathon.DoesNotExist:
        return Response({'error': 'Marathon plan not found'}, status=404)
    
    # Update all tracking with difficulty feedback
    MarathonDayTracking.objects.filter(marathon=marathon).update(difficulty=overall_difficulty)
    
    return Response({
        'success': True,
        'message': 'Week completed! Feedback recorded.',
        'should_regenerate': True,
        'feedback': {
            'difficulty': overall_difficulty,
            'preference': preference
        }
    })


# ---------------- LOG WORKOUT CALORIES TO DAILY PROGRESS ---------------- #
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def log_workout_calories(request):
    """Log calories burned from workout to daily health data"""
    from health_data.models import HealthData
    from datetime import date as dt
    
    user = request.user
    calories = request.data.get('calories', 0)
    workout_date = request.data.get('date', str(dt.today()))
    
    try:
        date_obj = dt.fromisoformat(workout_date)
    except:
        date_obj = dt.today()
    
    # Get or create health data for the day
    health_data, created = HealthData.objects.get_or_create(
        user=user,
        date=date_obj,
        defaults={
            'steps': 0,
            'calories_burned': 0,
            'distance': 0,
            'active_minutes': 0
        }
    )
    
    # Add workout calories to daily total
    health_data.calories_burned += calories
    health_data.save()
    
    return Response({
        'success': True,
        'total_calories': health_data.calories_burned,
        'date': str(date_obj)
    })


# ---------------- LOG MARATHON CALORIES TO DAILY PROGRESS ---------------- #
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def log_marathon_calories(request):
    """Log calories burned from marathon training to daily health data"""
    from health_data.models import HealthData
    from datetime import date as dt
    
    user = request.user
    calories = request.data.get('calories', 0)
    distance_km = request.data.get('distance_km', 0)
    duration_minutes = request.data.get('duration_minutes', 0)
    training_date = request.data.get('date', str(dt.today()))
    
    try:
        date_obj = dt.fromisoformat(training_date)
    except:
        date_obj = dt.today()
    
    # Get or create health data for the day
    health_data, created = HealthData.objects.get_or_create(
        user=user,
        date=date_obj,
        defaults={
            'steps': 0,
            'calories_burned': 0,
            'distance': 0,
            'active_minutes': 0
        }
    )
    
    # Add marathon training data to daily total
    health_data.calories_burned += calories
    health_data.distance += distance_km
    health_data.active_minutes += duration_minutes
    health_data.save()
    
    return Response({
        'success': True,
        'total_calories': health_data.calories_burned,
        'total_distance': health_data.distance,
        'total_active_minutes': health_data.active_minutes,
        'date': str(date_obj)
    })


# ---------------- GET DAILY WORKOUT SUMMARY ---------------- #
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_daily_workout_summary(request):
    """Get summary of calories burned from workouts and marathons today"""
    from health_data.models import HealthData
    from datetime import date as dt
    
    user = request.user
    today = dt.today()
    
    try:
        health_data = HealthData.objects.get(user=user, date=today)
        return Response({
            'success': True,
            'date': str(today),
            'calories_burned': health_data.calories_burned,
            'distance': health_data.distance,
            'active_minutes': health_data.active_minutes,
            'steps': health_data.steps
        })
    except HealthData.DoesNotExist:
        return Response({
            'success': True,
            'date': str(today),
            'calories_burned': 0,
            'distance': 0,
            'active_minutes': 0,
            'steps': 0
        })


# ---------------- GENERATE DAILY WORKOUT (NEW SYSTEM) ---------------- #
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_daily_workout(request):
    """Generate workout for TODAY only with progressive difficulty based on feedback"""
    from google import genai
    import os
    import json
    from health_data.models import Workout
    from datetime import date as dt, timedelta
    
    user = request.user
    today = dt.today()
    
    # Validate user profile
    if not user.height or not user.weight or not user.date_of_birth or not user.gender:
        return Response({
            "error": "Please complete your profile with height, weight, date of birth, and gender"
        }, status=400)
    
    # Calculate age and BMI
    age = request.data.get("age") or (today.year - user.date_of_birth.year - ((today.month, today.day) < (user.date_of_birth.month, user.date_of_birth.day)))
    weight = request.data.get("weight", user.weight)
    height = request.data.get("height", user.height)
    
    height_m = height / 100
    bmi = weight / (height_m * height_m)
    
    # Get fitness level and goal
    fitness_level = request.data.get("fitness_level", "intermediate")
    goal = request.data.get("goal") or user.fitness_goal or "general_fitness"
    
    # Get health data from request
    avg_steps = request.data.get("avg_steps", 5000)
    sleep_hours = request.data.get("sleep_hours", 7)
    spo2 = request.data.get("spo2", 98)
    
    # Get yesterday's workout and feedback for progression
    yesterday = today - timedelta(days=1)
    prev_workout = Workout.objects.filter(
        user=user,
        is_daily_plan=True,
        date=yesterday
    ).order_by('-created_at').first()
    
    prev_feedback = prev_workout.user_feedback if prev_workout else None
    prev_day_number = prev_workout.plan_day_number if prev_workout else 0
    current_day_number = prev_day_number + 1
    
    # Determine difficulty adjustment based on feedback
    difficulty_adjustment = ""
    if prev_feedback == 'easy':
        difficulty_adjustment = "INCREASE difficulty by 15%. Add more reps, sets, or weight. User found previous workout too easy."
    elif prev_feedback == 'difficult':
        difficulty_adjustment = "DECREASE difficulty by 15%. Reduce reps, sets, or weight. User found previous workout too hard."
    elif prev_feedback == 'just_right':
        difficulty_adjustment = "MAINTAIN similar difficulty level. User found previous workout perfect."
    else:
        difficulty_adjustment = "This is the first workout. Start with moderate difficulty appropriate for their fitness level."
    
    # Get previous workout details for context
    prev_workout_summary = ""
    if prev_workout:
        try:
            prev_exercises = json.loads(prev_workout.description) if prev_workout.description else []
            prev_workout_summary = f"\nPrevious Workout (Day {prev_day_number}):\n"
            prev_workout_summary += f"- Total Duration: {prev_workout.duration} minutes\n"
            prev_workout_summary += f"- Total Calories: {prev_workout.calories_burned}\n"
            prev_workout_summary += f"- Exercises: {len(prev_exercises)}\n"
            prev_workout_summary += f"- User Feedback: {prev_feedback or 'No feedback'}\n"
        except:
            prev_workout_summary = ""
    
    # Configure Gemini
    client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))
    
    # Create prompt for daily workout
    prompt = f"""Generate a personalized workout for TODAY ONLY (Day {current_day_number}) in JSON format:

User Profile:
- Age: {age}
- Gender: {user.gender}
- Weight: {weight} kg
- Height: {height} cm
- BMI: {bmi:.1f}
- Fitness Level: {fitness_level}
- Goal: {goal}

Health Data:
- Average Daily Steps: {avg_steps}
- Average Sleep: {sleep_hours} hours
- SpO2 Level: {spo2}%

{prev_workout_summary}

DIFFICULTY ADJUSTMENT:
{difficulty_adjustment}

Requirements:
1. Generate 6-8 exercises for TODAY only
2. Include specific workout types (cardio, strength, flexibility, hiit, yoga, core)
3. Provide specific reps/duration for each exercise
4. Calculate estimated calories for each exercise
5. Total workout should be 30-60 minutes
6. {difficulty_adjustment}
7. Ensure variety - don't repeat same exercises as yesterday

Return ONLY valid JSON (NO markdown, NO backticks):
{{
    "workout_name": "Day {current_day_number} - [Focus Area]",
    "total_duration_minutes": 45,
    "total_calories": 350,
    "exercises": [
        {{
            "name": "Exercise name",
            "workout_type": "cardio",
            "reps_or_duration": "3 sets of 12 reps",
            "calories": 50
        }}
    ]
}}"""
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        response_text = response.text.strip()
        
        # Extract JSON
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        workout_data = json.loads(response_text)
        
        # Store in database as daily plan
        workout = Workout.objects.create(
            user=user,
            workout_name=workout_data.get('workout_name', f'Day {current_day_number} Workout'),
            workout_type='Daily Progressive',
            duration=workout_data.get('total_duration_minutes', 0),
            calories_burned=workout_data.get('total_calories', 0),
            intensity='moderate',
            date=today,
            description=json.dumps(workout_data.get('exercises', [])),
            is_daily_plan=True,
            plan_day_number=current_day_number
        )
        
        return Response({
            "success": True,
            "workout": {
                "id": workout.id,
                "workout_name": workout.workout_name,
                "day_number": current_day_number,
                "total_duration": workout.duration,
                "total_calories": workout.calories_burned,
                "exercises": workout_data.get('exercises', []),
                "previous_feedback": prev_feedback
            }
        })
        
    except Exception as e:
        return Response({
            "error": f"Failed to generate daily workout: {str(e)}"
        }, status=500)


# ---------------- COMPLETE DAILY WORKOUT WITH FEEDBACK ---------------- #
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def complete_daily_workout(request):
    """Mark today's workout as complete and save user feedback"""
    from health_data.models import Workout
    from datetime import date as dt
    
    user = request.user
    workout_id = request.data.get('workout_id')
    feedback = request.data.get('feedback')  # easy, just_right, difficult
    notes = request.data.get('notes', '')
    
    if not workout_id or not feedback:
        return Response({
            "error": "workout_id and feedback are required"
        }, status=400)
    
    if feedback not in ['easy', 'just_right', 'difficult']:
        return Response({
            "error": "feedback must be 'easy', 'just_right', or 'difficult'"
        }, status=400)
    
    try:
        workout = Workout.objects.get(id=workout_id, user=user)
        workout.user_feedback = feedback
        workout.feedback_notes = notes
        workout.save()
        
        return Response({
            "success": True,
            "message": "Workout completed! Feedback saved.",
            "feedback": feedback,
            "next_workout_info": "Generate tomorrow's workout based on this feedback"
        })
        
    except Workout.DoesNotExist:
        return Response({
            "error": "Workout not found"
        }, status=404)


# ---------------- GET TODAY'S WORKOUT ---------------- #
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_todays_workout(request):
    """Get today's workout if it exists"""
    from health_data.models import Workout
    from .models import WorkoutExerciseTracking
    from datetime import date as dt
    
    user = request.user
    today = dt.today()
    
    # Get today's daily plan workout
    workout = Workout.objects.filter(
        user=user,
        is_daily_plan=True,
        date=today
    ).order_by('-created_at').first()
    
    if not workout:
        return Response({
            'has_workout': False,
            'message': 'No workout for today. Generate one!'
        })
    
    # Parse exercises
    try:
        exercises = json.loads(workout.description) if workout.description else []
    except:
        exercises = []
    
    # Get tracking status for each exercise
    exercises_with_tracking = []
    for idx, exercise in enumerate(exercises):
        tracking = WorkoutExerciseTracking.objects.filter(
            workout=workout,
            exercise_index=idx
        ).first()
        
        exercises_with_tracking.append({
            'index': idx,
            'name': exercise.get('name', ''),
            'workout_type': exercise.get('workout_type', 'general'),
            'reps_or_duration': exercise.get('reps_or_duration', ''),
            'calories': exercise.get('calories', 0),
            'completed': tracking.completed if tracking else False
        })
    
    # Check if all exercises are completed
    all_completed = all(e['completed'] for e in exercises_with_tracking)
    
    return Response({
        'has_workout': True,
        'workout': {
            'id': workout.id,
            'workout_name': workout.workout_name,
            'day_number': workout.plan_day_number,
            'total_duration': workout.duration,
            'total_calories': workout.calories_burned,
            'exercises': exercises_with_tracking,
            'all_completed': all_completed,
            'has_feedback': workout.user_feedback is not None,
            'feedback': workout.user_feedback,
            'created_at': workout.created_at
        }
    })


# ---------------- CHECK ACTIVE WORKOUT PLAN ---------------- #
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def check_active_workout_plan(request):
    """Check if user has an active workout plan (multi-day or daily)"""
    from health_data.models import Workout
    from datetime import date as dt
    
    user = request.user
    today = dt.today()
    
    # Check for today's daily plan
    daily_workout = Workout.objects.filter(
        user=user,
        is_daily_plan=True,
        date=today
    ).first()
    
    if daily_workout:
        return Response({
            'has_active_plan': True,
            'plan_type': 'daily',
            'workout_id': daily_workout.id,
            'day_number': daily_workout.plan_day_number,
            'message': f"You have today's workout (Day {daily_workout.plan_day_number})"
        })
    
    # Check for multi-day plan
    multi_day_workout = Workout.objects.filter(
        user=user,
        workout_type='AI Generated',
        date__gte=today
    ).first()
    
    if multi_day_workout:
        return Response({
            'has_active_plan': True,
            'plan_type': 'multi_day',
            'workout_id': multi_day_workout.id,
            'message': "You have an active multi-day workout plan"
        })
    
    return Response({
        'has_active_plan': False,
        'message': 'No active workout plan'
    })


# ---------------- CHECK ACTIVE MARATHON PLAN ---------------- #
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def check_active_marathon_plan(request):
    """Check if user has an active marathon training plan"""
    from health_data.models import Marathon
    
    user = request.user
    
    # Check for active marathon plan
    marathon = Marathon.objects.filter(
        user=user,
        status='training'
    ).order_by('-created_at').first()
    
    if marathon:
        return Response({
            'has_active_plan': True,
            'marathon_id': marathon.id,
            'marathon_name': marathon.marathon_name,
            'target_date': str(marathon.target_date),
            'distance': marathon.distance,
            'message': f"You have an active marathon plan: {marathon.marathon_name}"
        })
    
    return Response({
        'has_active_plan': False,
        'message': 'No active marathon plan'
    })
