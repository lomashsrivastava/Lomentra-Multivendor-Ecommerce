import sys

log_path = r"C:\Users\Dell\.gemini\antigravity\brain\bc1fa028-9695-467a-b867-3efa8d0f67b7\.system_generated\logs\overview.txt"
output_path = r"C:\Users\Dell\Desktop\Multi Vendor Ecommerce SaaS Platform\scratch\overview_raw_inspection.txt"

with open(log_path, 'r', encoding='utf-8', errors='ignore') as f, open(output_path, 'w', encoding='utf-8') as out:
    for idx in range(15):
        line = f.readline()
        if not line:
            break
        out.write(f"Line {idx}: length={len(line)}\n")
        out.write(line[:250] + "\n")
        out.write("-" * 50 + "\n")

print("Wrote overview_raw_inspection.txt successfully.")
