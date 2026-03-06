import os, psycopg2, json
from dotenv import load_dotenv
load_dotenv('.env')
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()

cur.execute('SELECT id, email, employee_id FROM profiles;')
profs = cur.fetchall()

cur.execute('SELECT id, email, employee_id FROM employees;')
emps = cur.fetchall()

data = {
    'profiles': [{'id': r[0], 'email': r[1], 'emp_id': r[2]} for r in profs],
    'employees': [{'id': r[0], 'email': r[1], 'emp_id': r[2]} for r in emps],
}

with open('db_dump.json', 'w') as f:
    json.dump(data, f, indent=2)
