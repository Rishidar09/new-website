import os, psycopg2
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
conn = psycopg2.connect(os.getenv("DATABASE_URL"))
cur = conn.cursor()

# Get all profiles and their employee links
cur.execute("SELECT email, role, employee_id FROM profiles ORDER BY email")
print("=== ALL PROFILES ===")
for row in cur.fetchall():
    print(row)

# Get all employees
cur.execute("SELECT id, employee_id, email, full_name FROM employees ORDER BY email")
print("\n=== ALL EMPLOYEES ===")
for row in cur.fetchall():
    print(row)

cur.close()
conn.close()
