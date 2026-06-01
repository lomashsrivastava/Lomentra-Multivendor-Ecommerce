import json
import os

log_path = r"C:\Users\Dell\.gemini\antigravity\brain\bc1fa028-9695-467a-b867-3efa8d0f67b7\.system_generated\logs\overview.txt"

with open(log_path, 'r', encoding='utf-8', errors='ignore') as f:
    for idx, line in enumerate(f):
        if not line.strip():
            continue
        try:
            data = json.loads(line)
            content = data.get("content", "")
            if len(content) > 1000:
                print(f"Line {idx}: step_index={data.get('step_index')}, source={data.get('source')}, type={data.get('type')}, length={len(content)}")
        except Exception as e:
            print(f"Line {idx}: not JSON, length={len(line)}")
