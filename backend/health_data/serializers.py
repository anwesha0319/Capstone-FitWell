from rest_framework import serializers
from .models import (
    HealthData, HeartRateData, SleepData,
    Diet, Marathon, Workout
)

class HealthDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = HealthData
        fields = ['id', 'date', 'steps', 'calories_burned', 'distance', 
                  'active_minutes', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class HeartRateDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = HeartRateData
        fields = ['id', 'timestamp', 'heart_rate', 'created_at']
        read_only_fields = ['id', 'created_at']

class SleepDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = SleepData
        fields = ['id', 'date', 'sleep_duration', 'sleep_quality', 
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class HealthDataBulkSerializer(serializers.Serializer):
    health_data = HealthDataSerializer(many=True, required=False)
    heart_rate_data = HeartRateDataSerializer(many=True, required=False)
    sleep_data = SleepDataSerializer(many=True, required=False)

class DietSerializer(serializers.ModelSerializer):
    class Meta:
        model = Diet
        fields = ['id', 'daily_calories', 'meal_plan', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class MarathonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Marathon
        fields = ['id', 'marathon_name', 'distance', 'target_date', 'target_time',
                  'status', 'location', 'actual_time', 'completed_date', 'notes',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class WorkoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = Workout
        fields = ['id', 'workout_name', 'workout_type', 'duration', 'calories_burned',
                  'intensity', 'date', 'description', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']