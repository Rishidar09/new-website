import os, psycopg2
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
conn = psycopg2.connect(os.getenv("DATABASE_URL"))
cur = conn.cursor()

# Find what reviewed_by references
cur.execute("""
    SELECT tc.constraint_name, ccu.table_name AS foreign_table, ccu.column_name AS foreign_col
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.constraint_column_usage AS ccu
      ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_name = 'leaves'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND tc.constraint_name LIKE '%reviewed_by%'
""")
print("FK on reviewed_by:", cur.fetchall())

# Drop the FK constraint so reviewed_by is just a plain UUID
cur.execute("ALTER TABLE leaves DROP CONSTRAINT IF EXISTS leaves_reviewed_by_fkey")
conn.commit()
print("✅ Dropped FK constraint on reviewed_by - now a plain UUID field")
cur.close()
conn.close()
