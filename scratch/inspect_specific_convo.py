import os

log_path = r"C:\Users\Dell\.gemini\antigravity\brain\7669d0ab-c1a2-4687-a7fe-9b58c80e6473\.system_generated\logs\overview.txt"
if os.path.exists(log_path):
    print("Log exists! Length:", os.path.getsize(log_path))
    with open(log_path, 'r', encoding='utf-8', errors='ignore') as f:
        for idx in range(10):
            line = f.readline()
            if not line:
                break
            print(f"Line {idx}: {line[:200]}")
else:
    print("Log does not exist.")
