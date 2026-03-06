import os, psycopg2
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
conn = psycopg2.connect(os.getenv("DATABASE_URL"))
cur = conn.cursor()

# Show all profiles with their employee links
cur.execute("""
    SELECT p.email, p.role, p.employee_id, e.id as emp_uuid, e.email as emp_email, e.full_name
    FROM profiles p
    LEFT JOIN employees e ON p.email = e.email
    ORDER BY p.email
""")
print("=== PROFILE + EMPLOYEE JOIN ===")
for row in cur.fetchall():
    print(row)

cur.close()
conn.close()
