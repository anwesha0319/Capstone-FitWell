import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fitness_backend.settings')
django.setup()

from django.db import connection

cursor = connection.cursor()

print("=" * 60)
print("CHECKING USERS TABLE")
print("=" * 60)

# Check if users table exists and its structure
cursor.execute("""
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name LIKE '%user%'
    ORDER BY table_name;
""")

tables = cursor.fetchall()
print("\nTables with 'user' in name:")
for table in tables:
    print(f"  - {table[0]}")

# Try to find the sequence for users table
cursor.execute("""
    SELECT pg_get_serial_sequence('users', 'id');
""")
result = cursor.fetchone()
print(f"\nSequence for 'users' table: {result[0] if result else 'Not found'}")

# Reset the users sequence
if result and result[0]:
    try:
        cursor.execute(f"ALTER SEQUENCE {result[0]} RESTART WITH 1")
        print(f"   ✓ Reset {result[0]} to 1")
    except Exception as e:
        print(f"   ✗ Error: {e}")
else:
    # Try common sequence names
    possible_sequences = [
        'users_id_seq',
        'accounts_user_id_seq',
        'auth_user_id_seq'
    ]
    
    print("\nTrying common sequence names...")
    for seq_name in possible_sequences:
        try:
            cursor.execute(f"ALTER SEQUENCE {seq_name} RESTART WITH 1")
            print(f"   ✓ Reset {seq_name} to 1")
            break
        except Exception as e:
            print(f"   ✗ {seq_name} not found")

print("\n" + "=" * 60)
print("DONE!")
print("=" * 60)
