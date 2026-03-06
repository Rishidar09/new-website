import os, psycopg2
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
DATABASE_URL = os.getenv("DATABASE_URL")

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'leaves' ORDER BY ordinal_position")
cols = [r[0] for r in cur.fetchall()]
print("LEAVES COLUMNS:", cols)

needed = ['reviewed_by', 'reviewed_at', 'remarks', 'attachment_url', 'days']
for col in needed:
    if col not in cols:
        print(f"MISSING: {col}")
        dtype = 'TIMESTAMPTZ' if col == 'reviewed_at' else ('TEXT' if col in ['remarks', 'attachment_url'] else ('INTEGER' if col == 'days' else 'UUID'))
        cur.execute(f"ALTER TABLE leaves ADD COLUMN IF NOT EXISTS {col} {dtype}")
        print(f"  -> Added {col} ({dtype})")

conn.commit()
cur.close()
conn.close()
print("Done.")
