import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fitness_backend.settings')
django.setup()

from django.db import connection

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
        print(f"Reset {sequence}")
    except Exception as e:
        print(f"Could not reset {sequence}: {e}")
    
print('\nAuto-increment IDs reset to 1 for all tables')
