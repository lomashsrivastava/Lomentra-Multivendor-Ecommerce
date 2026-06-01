import json

log_path = r"C:\Users\Dell\.gemini\antigravity\brain\bc1fa028-9695-467a-b867-3efa8d0f67b7\.system_generated\logs\overview.txt"
output_path = r"C:\Users\Dell\Desktop\Multi Vendor Ecommerce SaaS Platform\scratch\inspected_matches.txt"

lines_to_inspect = [783, 796, 803, 816, 841, 852]

with open(log_path, 'r', encoding='utf-8', errors='ignore') as f, open(output_path, 'w', encoding='utf-8') as out:
    for idx, line in enumerate(f):
        if idx in lines_to_inspect:
            out.write(f"=== Line {idx} ===\n")
            try:
                data = json.loads(line)
                content = data.get("content", "")
                out.write(str(content) + "\n")
            except Exception:
                out.write(line + "\n")
            out.write("="*40 + "\n\n")

print("Wrote matches to inspected_matches.txt successfully.")
