import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
DATABASE_URL = os.getenv("DATABASE_URL")

def check_db():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    print("--- Profiles ---")
    cur.execute("SELECT email, role, employee_id FROM profiles")
    for row in cur.fetchall():
        print(row)
        
    print("\n--- Employees ---")
    cur.execute("SELECT email, full_name, employee_id FROM employees")
    for row in cur.fetchall():
        print(row)
        
    cur.close()
    conn.close()

if __name__ == "__main__":
    check_db()
