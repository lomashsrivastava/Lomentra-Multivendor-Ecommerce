import json

log_path = r"C:\Users\Dell\.gemini\antigravity\brain\bc1fa028-9695-467a-b867-3efa8d0f67b7\.system_generated\logs\overview.txt"

with open(log_path, 'r', encoding='utf-8', errors='ignore') as f:
    line = f.readline()

print(f"Line length: {len(line)}")
try:
    data = json.loads(line)
    content = data.get("content", "")
    print(f"Content length: {len(content)}")
    with open(r"C:\Users\Dell\Desktop\Multi Vendor Ecommerce SaaS Platform\scratch\line_0_debug.txt", "w", encoding="utf-8") as out:
        out.write(content)
    print("Content written to line_0_debug.txt")
except Exception as e:
    print("Error:", e)
