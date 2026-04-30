import requests, os
from dotenv import load_dotenv

load_dotenv()

token = os.environ.get('HF_TOKEN')

print("RAW:", repr(token))
print("LEN:", len(token))

token = token.strip()

resp = requests.get(
    "https://huggingface.co/api/whoami",
    headers={"Authorization": f"Bearer {token}"}
)

print("STATUS:", resp.status_code)
print("RESPONSE:", resp.text)