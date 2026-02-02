import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fitness_backend.settings')
django.setup()

from django.db import connection

cursor = connection.cursor()

# Get all sequences
cursor.execute("""
    SELECT sequence_name 
    FROM information_schema.sequences 
    WHERE sequence_schema = 'public'
    ORDER BY sequence_name;
""")

sequences = cursor.fetchall()

print("=" * 60)
print("ALL SEQUENCES IN DATABASE")
print("=" * 60)
for seq in sequences:
    print(f"  - {seq[0]}")

print("\n" + "=" * 60)
print("RESETTING ALL SEQUENCES TO 1")
print("=" * 60)

for seq in sequences:
    seq_name = seq[0]
    try:
        cursor.execute(f"ALTER SEQUENCE {seq_name} RESTART WITH 1")
        print(f"   ✓ Reset {seq_name}")
    except Exception as e:
        print(f"   ✗ Could not reset {seq_name}: {e}")

print("\n" + "=" * 60)
print("ALL SEQUENCES RESET TO 1!")
print("=" * 60)
