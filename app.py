import os
from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS
import requests

load_dotenv()

app = Flask(__name__)
cors = CORS(app, resources={r"/": { "origins": [
    "http://localhost:5173",
    "https://cemantix-api.onrender.com/"]
}})

# ENV variables for Notion integration
CEMANTIX_NOTION_TOKEN = os.getenv("CEMANTIX_NOTION_TOKEN")
CEMANTIX_DATABASE_ID = os.getenv("CEMANTIX_DATABASE_ID")
CEMANTLE_NOTION_TOKEN = os.getenv("CEMANTLE_NOTION_TOKEN")
CEMANTLE_DATABASE_ID = os.getenv("CEMANTLE_DATABASE_ID")

PAYLOAD = {"page_size": 500}

@app.route('/')
def get_stats():
    return jsonify(build_stats()), 200

def build_stats():
    # cemantix_data = fetch_cemantix_data(CEMANTIX_NOTION_TOKEN, CEMANTIX_DATABASE_ID)
    # cemantle_data = fetch_cemantix_data(CEMANTLE_NOTION_TOKEN, CEMANTLE_DATABASE_ID)

    return {
        "cemantix": {
            "lastWord": 'cemantixWord'
        },
        "cemantle": {
            "lastWord": 'cemantleWord'
        }
    }

def fetch_cemantix_data(token, db_id):
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Notion-Version": "2021-08-16",
    }
    api_endpoint = f"https://api.notion.com/v1/databases/{db_id}/query"

    response = requests.post(api_endpoint, json=PAYLOAD, headers=headers)

    print(response.status_code, response.reason)

    return response

def retrieve_word_of_the_day(data):
    word = data.json()["results"][0]["properties"]["Word"]["rich_text"][0]["plain_text"]

    return word