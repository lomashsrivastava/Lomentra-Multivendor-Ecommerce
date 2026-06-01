import json

log_path = r"C:\Users\Dell\.gemini\antigravity\brain\bc1fa028-9695-467a-b867-3efa8d0f67b7\.system_generated\logs\overview.txt"

with open(log_path, 'r', encoding='utf-8', errors='ignore') as f:
    for idx, line in enumerate(f):
        try:
            data = json.loads(line)
            content = data.get("content", "")
            if len(content) > 5000:
                print(f"Line {idx}: Content length is {len(content)}")
                # Write it to a file
                with open(rf"C:\Users\Dell\Desktop\Multi Vendor Ecommerce SaaS Platform\scratch\large_line_{idx}.txt", "w", encoding="utf-8") as out:
                    out.write(content)
                print(f"Written to large_line_{idx}.txt")
        except Exception as e:
            pass
