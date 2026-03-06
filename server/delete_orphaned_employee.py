import os, psycopg2
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
conn = psycopg2.connect(os.getenv("DATABASE_URL"))
cur = conn.cursor()

try:
    email = "verify_onboard_1772773610245@example.com"
    cur.execute("DELETE FROM employees WHERE email = %s", (email,))
    conn.commit()
    print(f"✅ Employee {email} deleted successfully from employees table!")
except Exception as e:
    conn.rollback()
    print(f"❌ Error deleting employee: {e}")
finally:
    cur.close()
    conn.close()
