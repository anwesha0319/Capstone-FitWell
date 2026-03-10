from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from django.db.models import Avg, Sum, Count
from datetime import datetime, timedelta, date
from .models import (
    HealthData, HeartRateData, SleepData,
    Diet, Marathon, Workout, WaterIntake
)
from .serializers import (
    HealthDataSerializer, HeartRateDataSerializer,
    SleepDataSerializer,
    HealthDataBulkSerializer, DietSerializer,
    MarathonSerializer, WorkoutSerializer
)

class DietListCreateView(generics.ListCreateAPIView):
    serializer_class = DietSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Diet.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class DietDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DietSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Diet.objects.filter(user=self.request.user)

class MarathonListCreateView(generics.ListCreateAPIView):
    serializer_class = MarathonSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Marathon.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class MarathonDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MarathonSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Marathon.objects.filter(user=self.request.user)

class WorkoutListCreateView(generics.ListCreateAPIView):
    serializer_class = WorkoutSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Workout.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class WorkoutDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = WorkoutSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Workout.objects.filter(user=self.request.user)

class HealthDataListCreateView(generics.ListCreateAPIView):
    serializer_class = HealthDataSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = HealthData.objects.filter(user=self.request.user)
        days = self.request.query_params.get('days', None)
        if days:
            start_date = datetime.now().date() - timedelta(days=int(days))
            queryset = queryset.filter(date__gte=start_date)
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class HeartRateDataListCreateView(generics.ListCreateAPIView):
    serializer_class = HeartRateDataSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return HeartRateData.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class SleepDataListCreateView(generics.ListCreateAPIView):
    serializer_class = SleepDataSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SleepData.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class BulkHealthDataCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = HealthDataBulkSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        created_counts = {}

        # Create health data
        if 'health_data' in data:
            health_objs = [
                HealthData(user=request.user, **item)
                for item in data['health_data']
            ]
            HealthData.objects.bulk_create(
                health_objs,
                update_conflicts=True,
                update_fields=['steps', 'calories_burned', 'distance', 'active_minutes'],
                unique_fields=['user', 'date']
            )
            created_counts['health_data'] = len(health_objs)

        # Create heart rate data
        if 'heart_rate_data' in data:
            hr_objs = [
                HeartRateData(user=request.user, **item)
                for item in data['heart_rate_data']
            ]
            HeartRateData.objects.bulk_create(hr_objs, ignore_conflicts=True)
            created_counts['heart_rate_data'] = len(hr_objs)

        # Create sleep data
        if 'sleep_data' in data:
            sleep_objs = [
                SleepData(user=request.user, **item)
                for item in data['sleep_data']
            ]
            SleepData.objects.bulk_create(
                sleep_objs,
                update_conflicts=True,
                update_fields=['sleep_duration', 'sleep_quality'],
                unique_fields=['user', 'date']
            )
            created_counts['sleep_data'] = len(sleep_objs)

        # Workout sessions removed - using Workout table instead

        return Response({
            'message': 'Health data synced successfully',
            'created': created_counts
        }, status=status.HTTP_201_CREATED)

class AnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        days = int(request.query_params.get('days', 7))
        start_date = datetime.now().date() - timedelta(days=days)

        health_data = HealthData.objects.filter(
            user=request.user,
            date__gte=start_date
        )

        analytics = {
            'period': f'Last {days} days',
            'total_steps': health_data.aggregate(Sum('steps'))['steps__sum'] or 0,
            'total_calories': health_data.aggregate(Sum('calories_burned'))['calories_burned__sum'] or 0,
            'total_distance': health_data.aggregate(Sum('distance'))['distance__sum'] or 0,
            'avg_steps': health_data.aggregate(Avg('steps'))['steps__avg'] or 0,
            'avg_calories': health_data.aggregate(Avg('calories_burned'))['calories_burned__avg'] or 0,
            'daily_data': list(health_data.values('date', 'steps', 'calories_burned', 'distance'))
        }

        # Heart rate stats
        hr_data = HeartRateData.objects.filter(
            user=request.user,
            timestamp__date__gte=start_date
        )
        analytics['avg_heart_rate'] = hr_data.aggregate(Avg('heart_rate'))['heart_rate__avg'] or 0

        # Sleep stats
        sleep_data = SleepData.objects.filter(
            user=request.user,
            date__gte=start_date
        )
        analytics['avg_sleep_hours'] = sleep_data.aggregate(Avg('sleep_duration'))['sleep_duration__avg'] or 0

        return Response(analytics)



# Water Intake Endpoints
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_water_intake(request):
    """Save or update water intake for a specific date"""
    user = request.user
    from datetime import date as date_class
    intake_date = request.data.get('date', str(date_class.today()))
    amount = request.data.get('amount')
    goal = request.data.get('goal', 3.0)
    
    if amount is None:
        return Response({'error': 'Amount is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        intake_date = date_class.fromisoformat(intake_date)
    except ValueError:
        intake_date = date_class.today()
    
    water_intake, created = WaterIntake.objects.update_or_create(
        user=user,
        date=intake_date,
        defaults={'amount': amount, 'goal': goal}
    )
    
    return Response({
        'success': True,
        'message': 'Water intake saved successfully',
        'date': str(water_intake.date),
        'amount': water_intake.amount,
        'goal': water_intake.goal
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_water_intake(request):
    """Get water intake for a specific date or date range"""
    user = request.user
    from datetime import date as date_class, timedelta
    intake_date = request.GET.get('date')
    days = int(request.GET.get('days', 7))
    
    if intake_date:
        # Get specific date
        try:
            intake_date = date_class.fromisoformat(intake_date)
        except ValueError:
            intake_date = date_class.today()
        
        try:
            water_intake = WaterIntake.objects.get(user=user, date=intake_date)
            return Response({
                'success': True,
                'date': str(water_intake.date),
                'amount': water_intake.amount,
                'goal': water_intake.goal
            })
        except WaterIntake.DoesNotExist:
            return Response({
                'success': False,
                'message': 'No water intake data for this date',
                'date': str(intake_date),
                'amount': 0,
                'goal': 3.0
            })
    else:
        # Get last N days
        start_date = date_class.today() - timedelta(days=days - 1)
        water_data = WaterIntake.objects.filter(
            user=user,
            date__gte=start_date,
            date__lte=date_class.today()
        ).order_by('date')
        
        # Create a complete week with 0 for missing days
        result = []
        current_date = start_date
        water_dict = {w.date: w for w in water_data}
        
        while current_date <= date_class.today():
            if current_date in water_dict:
                water = water_dict[current_date]
                result.append({
                    'date': str(water.date),
                    'day': current_date.strftime('%a'),
                    'amount': water.amount,
                    'goal': water.goal
                })
            else:
                result.append({
                    'date': str(current_date),
                    'day': current_date.strftime('%a'),
                    'amount': 0,
                    'goal': 3.0
                })
            current_date += timedelta(days=1)
        
        return Response({
            'success': True,
            'data': result
        })
