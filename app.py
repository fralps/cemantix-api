"""Module providing a function to get env variables"""
import os
from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS
import requests

load_dotenv()

app = Flask(__name__)
CORS(app, origins=[
    'http://localhost:5173',
    'https://cemantix-ui.vercel.app'
])


# ENV variables for Notion integration
CEMANTIX_NOTION_TOKEN = os.getenv("CEMANTIX_NOTION_TOKEN")
CEMANTIX_DATABASE_ID = os.getenv("CEMANTIX_DATABASE_ID")
CEMANTLE_NOTION_TOKEN = os.getenv("CEMANTLE_NOTION_TOKEN")
CEMANTLE_DATABASE_ID = os.getenv("CEMANTLE_DATABASE_ID")

PAYLOAD = {"page_size": 1}


@app.route('/')
def get_stats():
    """Function building json response."""
    return jsonify(build_stats()), 200


def build_stats():
    """Function retrieving building stats json."""
    cemantix_data = fetch_cemantix_data(
        CEMANTIX_NOTION_TOKEN, CEMANTIX_DATABASE_ID)
    cemantle_data = fetch_cemantix_data(
        CEMANTLE_NOTION_TOKEN, CEMANTLE_DATABASE_ID)

    return {
        "cemantix": {
            "lastWord": retrieve_word_of_the_day(cemantix_data),
            "elapsedTime": retrieve_elapsed_time(cemantix_data),
            "requestsNumber": retrieve_requests_number(cemantix_data),
            "date": retrieve_word_date(cemantix_data)
        },
        "cemantle": {
            "lastWord": retrieve_word_of_the_day(cemantle_data),
            "elapsedTime": retrieve_elapsed_time(cemantle_data),
            "requestsNumber": retrieve_requests_number(cemantle_data),
            "date": retrieve_word_date(cemantle_data)
        }
    }


def fetch_cemantix_data(token, db_id):
    """Function fetching cemantix data."""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Notion-Version": "2021-08-16",
    }
    api_endpoint = f"https://api.notion.com/v1/databases/{db_id}/query"

    response = requests.post(api_endpoint, json=PAYLOAD, headers=headers, timeout=30)

    print(response.status_code, response.reason)

    return response


def retrieve_word_of_the_day(data):
    """Function retrieving word of the day."""
    word = data.json()[
        "results"][0]["properties"]["Word"]["rich_text"][0]["plain_text"]

    return word


def retrieve_elapsed_time(data):
    """Function retrieving elapsed time."""
    elapsed_time = data.json(
    )["results"][0]["properties"]["Elapsed time"]["rich_text"][0]["plain_text"]

    return elapsed_time[:elapsed_time.rfind('.')]


def retrieve_requests_number(data):
    """Function retrieving request number."""
    requests_number = data.json(
    )["results"][0]["properties"]["Attempts"]["number"]

    return requests_number


def retrieve_word_date(data):
    """Function retrieving word date."""
    date = data.json()[
        "results"][0]["properties"]["Date"]["rich_text"][0]["plain_text"]
    parsed_date = date.split('/')
    result = f"{parsed_date[1]}/{parsed_date[0]}/{parsed_date[2]}"

    return result
