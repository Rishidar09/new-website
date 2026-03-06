import os, psycopg2
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
DATABASE_URL = os.getenv("DATABASE_URL")

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

email = 'anderishidarreddy@gmail.com'
full_name = 'Anderishi Darreddy'
employee_id = 'IIT-EMP-002'
department = 'Engineering'
role = 'Employee'

# Check if already exists
cur.execute("SELECT id FROM employees WHERE email = %s", (email,))
if cur.fetchone():
    print(f"Employee {email} already exists.")
else:
    cur.execute(
        "INSERT INTO employees (full_name, email, role, department, employee_id, status) VALUES (%s, %s, %s, %s, %s, 'Active')",
        (full_name, email, role, department, employee_id)
    )
    conn.commit()
    print(f"✅ Employee record for {full_name} ({email}) created successfully!")

# Update profile to link employee_id
cur.execute("SELECT id FROM employees WHERE email = %s", (email,))
emp = cur.fetchone()
if emp:
    cur.execute("UPDATE profiles SET employee_id = %s WHERE email = %s", (employee_id, email))
    conn.commit()
    print(f"✅ Profile updated with employee_id: {employee_id}")

cur.close()
conn.close()
print("Done.")
