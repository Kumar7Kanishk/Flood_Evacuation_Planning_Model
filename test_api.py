import json
import requests
from requests.exceptions import HTTPError, ConnectionError, Timeout
import time

# Step 1: Load config file
with open("config.json") as f:
    config = json.load(f)

CLIENT_ID = config["client_id"]
CLIENT_SECRET = config["client_secret"]
API_URL = config["api_url"]

# Step 2: Get access token
def get_access_token():
    payload = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "grant_type": "client_credentials"
    }
    response = requests.post(API_URL, data=payload)
    response.raise_for_status()
    return response.json()["access_token"]

# Step 3: Test API call with error handling + retries
def test_api_call(token, retries=3, delay=5):
    headers = {"Authorization": f"Bearer {token}"}
    url = "https://services.sentinel-hub.com/api/v1/catalog/collections"

    for attempt in range(retries):
        try:
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            print("Collections available:", response.json())
            return
        except HTTPError as e:
            print(f"HTTP error occurred on attempt {attempt+1}: {e}")
        except ConnectionError as e:
            print(f"Network problem on attempt {attempt+1}: {e}")
        except Timeout as e:
            print(f"Request timed out on attempt {attempt+1}: {e}")
        except Exception as e:
            print(f"Unexpected error on attempt {attempt+1}: {e}")

        if attempt < retries - 1:
            print(f"Retrying in {delay} seconds...")
            time.sleep(delay)
        else:
            print("All retries failed. Please try again later.")

# Step 4: Run the workflow
if __name__ == "__main__":
    token = get_access_token()
    print("Access token received!")
    test_api_call(token)

