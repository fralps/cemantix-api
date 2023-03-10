import os
from dotenv import load_dotenv
from flask import Flask, jsonify
import requests
import json

load_dotenv()

app = Flask(__name__)

# ENV variables for Notion integration
CEMANTIX_NOTION_TOKEN = os.getenv("CEMANTIX_NOTION_TOKEN")
CEMANTIX_DATABASE_ID = os.getenv("CEMANTIX_DATABASE_ID")

API_ENDPOINT = f"https://api.notion.com/v1/databases/{CEMANTIX_DATABASE_ID}/query"
PAYLOAD = {"page_size": 500}
HEADERS = {
    "Authorization": f"Bearer {CEMANTIX_NOTION_TOKEN}",
    "Content-Type": "application/json",
    "Notion-Version": "2021-08-16",
}

@app.route('/')
def get_stats():
    return jsonify(build_stats()), 200

def build_stats():
    cemantix_data = fetch_cemantix_data()
    word_of_the_day = retrieve_word_of_the_day(cemantix_data)

    return {
        'lastWord': word_of_the_day
    }

def fetch_cemantix_data():
    response = requests.post(API_ENDPOINT, json=PAYLOAD, headers=HEADERS)

    print(response.status_code, response.reason)

    return response

def retrieve_word_of_the_day(data):
    word = data.json()["results"][0]["properties"]["Word"]["rich_text"][0]["plain_text"]

    return word