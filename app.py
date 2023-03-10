from flask import Flask, jsonify
app = Flask(__name__)

@app.route('/')
def get_stats():
    return jsonify(build_stats()), 200

def build_stats():
    return { 
        "message": "Hello, World Bro!"
    }