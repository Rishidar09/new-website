import os, psycopg2
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
DATABASE_URL = os.getenv("DATABASE_URL")

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# Check all employees
cur.execute("SELECT id, email, full_name, employee_id FROM employees")
rows = cur.fetchall()
print("=== ALL EMPLOYEES ===")
for row in rows:
    print(row)

# Check all profiles
cur.execute("SELECT email, role, employee_id FROM profiles")
rows = cur.fetchall()
print("\n=== ALL PROFILES ===")
for row in rows:
    print(row)

# Try to simulate the leave lookup that happens in leaves.js
print("\n=== SIMULATING LEAVE LOOKUP FOR anderishidarreddy@gmail.com ===")
cur.execute("SELECT id FROM employees WHERE email = %s", ('anderishidarreddy@gmail.com',))
rows = cur.fetchall()
print(f"Found: {rows}")

cur.close()
conn.close()
print("\nDone.")
