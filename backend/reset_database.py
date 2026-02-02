import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fitness_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from health_data.models import WaterIntake, HealthData, DailyNutritionLog
from ml_models.models import MealPlan, MealItem
from django.db import connection

User = get_user_model()

print("=" * 60)
print("DELETING ALL DATA FROM DATABASE")
print("=" * 60)

# Delete all data
print("\n1. Deleting Users...")
user_count = User.objects.all().count()
User.objects.all().delete()
print(f"   ✓ Deleted {user_count} users")

print("\n2. Deleting Water Intake records...")
water_count = WaterIntake.objects.all().count()
WaterIntake.objects.all().delete()
print(f"   ✓ Deleted {water_count} water intake records")

print("\n3. Deleting Health Data...")
health_count = HealthData.objects.all().count()
HealthData.objects.all().delete()
print(f"   ✓ Deleted {health_count} health data records")

print("\n4. Deleting Daily Nutrition Logs...")
nutrition_count = DailyNutritionLog.objects.all().count()
DailyNutritionLog.objects.all().delete()
print(f"   ✓ Deleted {nutrition_count} nutrition logs")

print("\n5. Deleting Meal Items...")
meal_item_count = MealItem.objects.all().count()
MealItem.objects.all().delete()
print(f"   ✓ Deleted {meal_item_count} meal items")

print("\n6. Deleting Meal Plans...")
meal_plan_count = MealPlan.objects.all().count()
MealPlan.objects.all().delete()
print(f"   ✓ Deleted {meal_plan_count} meal plans")

print("\n" + "=" * 60)
print("RESETTING AUTO-INCREMENT IDs TO 1")
print("=" * 60)

# Reset sequences
cursor = connection.cursor()
tables = [
    ('accounts_user', 'accounts_user_id_seq'),
    ('health_data_waterintake', 'health_data_waterintake_id_seq'), 
    ('health_data_healthdata', 'health_data_healthdata_id_seq'),
    ('health_data_dailynutritionlog', 'health_data_dailynutritionlog_id_seq'),
    ('ml_models_mealplan', 'ml_models_mealplan_id_seq'),
    ('ml_models_mealitem', 'ml_models_mealitem_id_seq')
]

for table, sequence in tables:
    try:
        cursor.execute(f"ALTER SEQUENCE {sequence} RESTART WITH 1")
        print(f"   ✓ Reset {sequence}")
    except Exception as e:
        print(f"   ✗ Could not reset {sequence}: {e}")

print("\n" + "=" * 60)
print("DATABASE RESET COMPLETE!")
print("=" * 60)
print("\nAll data deleted and IDs will start from 1 for new records.")
print("You can now register a new account with ID = 1")
print("=" * 60)
