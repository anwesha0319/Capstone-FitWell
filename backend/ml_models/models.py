from django.db import models
from django.conf import settings

# UserBodyProfile removed - using User table directly (has age, gender, height, weight)

class MealPlan(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    date = models.DateField()
    meal_type = models.CharField(max_length=20)


class MealItem(models.Model):
    meal = models.ForeignKey(MealPlan, on_delete=models.CASCADE, related_name="items")
    food_name = models.CharField(max_length=255)  # Increased from 100 to 255
    calories = models.FloatField()
    protein = models.FloatField()
    carbs = models.FloatField()
    fat = models.FloatField()
    image_url = models.TextField(null=True, blank=True)  # Store base64 or URL

class MealItemTracking(models.Model):
    meal_item = models.ForeignKey(MealItem, on_delete=models.CASCADE)
    status = models.CharField(max_length=20)  # eaten / skipped
    quantity_ratio = models.FloatField()  # 1.0 full, 0.5 half
    timestamp = models.DateTimeField(auto_now_add=True)


# Workout Plan Exercise Tracking
class WorkoutExerciseTracking(models.Model):
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('just_right', 'Just Right'),
        ('difficult', 'Difficult'),
    ]
    
    workout = models.ForeignKey('health_data.Workout', on_delete=models.CASCADE, related_name='exercise_tracking')
    exercise_index = models.IntegerField()  # Index in the exercises JSON array
    completed = models.BooleanField(default=False)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, null=True, blank=True)
    notes = models.TextField(blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'workout_exercise_tracking'
        unique_together = ['workout', 'exercise_index']
        ordering = ['exercise_index']


# Marathon Plan Day Tracking
class MarathonDayTracking(models.Model):
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('just_right', 'Just Right'),
        ('difficult', 'Difficult'),
    ]
    
    marathon = models.ForeignKey('health_data.Marathon', on_delete=models.CASCADE, related_name='day_tracking')
    day_index = models.IntegerField()  # Index in the weekly_schedule JSON array
    completed = models.BooleanField(default=False)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, null=True, blank=True)
    notes = models.TextField(blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'marathon_day_tracking'
        unique_together = ['marathon', 'day_index']
        ordering = ['day_index']
