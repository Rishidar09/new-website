import os
import psycopg2
import bcrypt
from dotenv import load_dotenv
import sys

# Load environment variables from the server/.env file
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

DATABASE_URL = os.getenv("DATABASE_URL")

def get_connection():
    try:
        return psycopg2.connect(DATABASE_URL)
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        sys.exit(1)

def hash_password(password):
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def list_users():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT email, role, status FROM profiles ORDER BY email")
    rows = cur.fetchall()
    
    print("\n" + "="*50)
    print(f"{'#':<3} | {'Email':<30} | {'Role':<10} | {'Status'}")
    print("-" * 50)
    
    for i, row in enumerate(rows):
        print(f"{i+1:<3} | {row[0]:<30} | {row[1]:<10} | {row[2]}")
    
    print("="*50)
    cur.close()
    conn.close()
    return rows

def add_user():
    print("\n--- Add New User ---")
    email = input("Email: ").strip()
    password = input("Password: ").strip()
    role = input("Role (hr/employee): ").strip().lower()
    
    if role not in ['hr', 'employee']:
        print("❌ Invalid role. Use 'hr' or 'employee'.")
        return

    hashed = hash_password(password)
    
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("INSERT INTO profiles (email, password_hash, role, status) VALUES (%s, %s, %s, 'Active')", (email, hashed, role))
        conn.commit()
        print(f"✅ User {email} added successfully!")
    except Exception as e:
        print(f"❌ Error adding user: {e}")
    finally:
        cur.close()
        conn.close()

def delete_user(email):
    confirm = input(f"Are you sure you want to delete {email}? (y/n): ")
    if confirm.lower() != 'y':
        return

    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM profiles WHERE email = %s", (email,))
        conn.commit()
        print(f"✅ User {email} deleted successfully!")
    except Exception as e:
        print(f"❌ Error deleting user: {e}")
    finally:
        cur.close()
        conn.close()

def edit_user(email):
    print(f"\n--- Editing {email} ---")
    print("(Press Enter to keep the current value)")
    
    new_role = input("New role (hr/employee): ").strip().lower()
    new_password = input("New password: ").strip()
    
    conn = get_connection()
    cur = conn.cursor()
    try:
        if new_role and new_role in ['hr', 'employee']:
            cur.execute("UPDATE profiles SET role = %s WHERE email = %s", (new_role, email))
            print("✅ Role updated.")
        elif new_role:
            print("⚠️ Invalid role, skipping role update.")

        if new_password:
            hashed = hash_password(new_password)
            cur.execute("UPDATE profiles SET password_hash = %s, is_first_login = FALSE WHERE email = %s", (hashed, email))
            print("✅ Password updated.")
            
        conn.commit()
    except Exception as e:
        print(f"❌ Error updating user: {e}")
    finally:
        cur.close()
        conn.close()

def main():
    print("🚀 IndusInnovate User Management CLI")
    while True:
        print("\nMain Menu:")
        print("1. List All Users")
        print("2. Add New User")
        print("3. Edit Existing User")
        print("4. Delete User")
        print("5. Exit")
        
        choice = input("\nSelect an option (1-5): ").strip()
        
        try:
            if choice == '1':
                list_users()
            elif choice == '2':
                add_user()
            elif choice == '3':
                users = list_users()
                if not users: continue
                idx = int(input("Enter the # of the user to edit: ")) - 1
                if 0 <= idx < len(users):
                    edit_user(users[idx][0])
                else:
                    print("❌ Invalid user number.")
            elif choice == '4':
                users = list_users()
                if not users: continue
                idx = int(input("Enter the # of the user to delete: ")) - 1
                if 0 <= idx < len(users):
                    delete_user(users[idx][0])
                else:
                    print("❌ Invalid user number.")
            elif choice == '5':
                print("Goodbye!")
                break
            else:
                print("❌ Invalid choice.")
        except ValueError:
            print("❌ Please enter a valid number.")
        except Exception as e:
            print(f"❌ An error occurred: {e}")

if __name__ == "__main__":
    main()
