import json

log_path = r"C:\Users\Dell\.gemini\antigravity\brain\bc1fa028-9695-467a-b867-3efa8d0f67b7\.system_generated\logs\overview.txt"
with open(log_path, 'r', encoding='utf-8', errors='ignore') as f:
    line0 = f.readline()

try:
    data = json.loads(line0)
    print("Keys:", data.keys())
    print("Content length:", len(data.get("content", "")))
    print("Snippet:")
    print(data.get("content", "")[:1000])
except Exception as e:
    print("Error parsing JSON:", e)
    print("Line snippet:")
    print(line0[:1000])
