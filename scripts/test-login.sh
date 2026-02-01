#!/bin/bash

echo "Testing admin login..."

curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  --data-raw '{
    "email": "human@speakabout.ai",
    "password": "SpeakAboutAI2025!"
  }' \
  -s | jq '.'