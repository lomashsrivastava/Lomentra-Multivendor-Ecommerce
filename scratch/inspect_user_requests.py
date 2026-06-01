import json

log_path = r"C:\Users\Dell\.gemini\antigravity\brain\bc1fa028-9695-467a-b867-3efa8d0f67b7\.system_generated\logs\overview.txt"

user_inputs = []

with open(log_path, 'r', encoding='utf-8', errors='ignore') as f:
    for idx, line in enumerate(f):
        try:
            data = json.loads(line)
            if data.get("source") == "USER_EXPLICIT" or data.get("type") == "USER_INPUT":
                user_inputs.append({
                    "line": idx,
                    "created_at": data.get("created_at"),
                    "content": data.get("content")
                })
        except Exception:
            pass

with open(r"C:\Users\Dell\Desktop\Multi Vendor Ecommerce SaaS Platform\scratch\user_requests.txt", "w", encoding="utf-8") as out:
    out.write(f"Total user inputs: {len(user_inputs)}\n")
    for ui in user_inputs:
        out.write(f"\n--- Line {ui['line']} ({ui['created_at']}) ---\n")
        out.write(ui['content'])
        out.write("\n" + "-" * 50 + "\n")
print("Done")
