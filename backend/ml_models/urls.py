from django.urls import path
from .views import (
    generate_ai_meal_plan, 
    track_meal_item, 
    daily_nutrition, 
    get_meal_plan, 
    check_active_plan, 
    generate_meal_image_endpoint,
    recalculate_meal_plan
)

urlpatterns = [
    path("generate-ai-meal-plan/", generate_ai_meal_plan),
    path("meal-plan/", get_meal_plan),
    path("track-meal-item/", track_meal_item),
    path("daily_nutrition/", daily_nutrition),
    path("check-active-plan/", check_active_plan),
    path("generate-meal-image/", generate_meal_image_endpoint),
    path("recalculate-meal-plan/", recalculate_meal_plan),
]
