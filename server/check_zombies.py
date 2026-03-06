import os, psycopg2
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
conn = psycopg2.connect(os.getenv("DATABASE_URL"))
cur = conn.cursor()

# Get all profiles
cur.execute("SELECT email FROM profiles ORDER BY email")
profiles = cur.fetchall()
print("=== PROFILES ===")
for p in profiles:
    print(p)

# Get all employees
cur.execute("SELECT id, email, full_name FROM employees ORDER BY email")
employees = cur.fetchall()
print("\n=== EMPLOYEES ===")
for e in employees:
    print(e)

cur.close()
conn.close()
