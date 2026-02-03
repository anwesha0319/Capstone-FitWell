from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from datetime import date, timedelta
from django.utils.timezone import now

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
