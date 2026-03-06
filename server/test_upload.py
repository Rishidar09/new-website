import requests
import os

# Using the server port 5001 from api.js logs
URL = "http://localhost:5001/api/leaves"

def test_leave():
    # Simulate a user token (we don't have a real one here, but we can test the directory/multer logic)
    # Actually, we need auth. Let's just create a dummy file to check directory permissions if possible.
    path = "c:\\Users\\D-IT\\Desktop\\website\\server\\uploads\\leaves\\test.txt"
    try:
        with open(path, "w") as f:
            f.write("test")
        print(f"✅ Successfully wrote to {path}")
        os.remove(path)
    except Exception as e:
        print(f"❌ Failed to write to uploads directory: {e}")

if __name__ == "__main__":
    test_leave()
