import json
import re

log_path = r"C:\Users\Dell\.gemini\antigravity\brain\bc1fa028-9695-467a-b867-3efa8d0f67b7\.system_generated\logs\overview.txt"
found_phases = {}

with open(log_path, 'r', encoding='utf-8', errors='ignore') as f:
    for line_num, line in enumerate(f):
        if not line.strip():
            continue
        try:
            data = json.loads(line)
            content = data.get("content", "")
            if not isinstance(content, str):
                content = str(content)
            
            # Check if this is the original prompt (it will be very large and mention Meesho, Flipkart, and many phases)
            if "ULTRA ENTERPRISE MASTER PROMPT" in content:
                print(f"Found original prompt in line {line_num} (length {len(content)})")
                # Let's search this content for any phase definitions from 25 to 50
                for phase_num in range(25, 45):
                    pattern = rf"Phase\s+{phase_num}\b"
                    match = re.search(pattern, content, re.IGNORECASE)
                    if match:
                        start = max(0, match.start() - 100)
                        end = min(len(content), match.end() + 2000)
                        found_phases[phase_num] = content[start:end]
        except Exception as e:
            # Not JSON or other error
            pass

# Let's write the results to a file
output_path = r"C:\Users\Dell\Desktop\Multi Vendor Ecommerce SaaS Platform\scratch\phases_26_to_40_extracted.txt"
with open(output_path, 'w', encoding='utf-8') as out:
    out.write(f"Total phases found in original prompt: {len(found_phases)}\n\n")
    for phase_num in sorted(found_phases.keys()):
        out.write(f"=================== Phase {phase_num} ===================\n")
        out.write(found_phases[phase_num])
        out.write("\n\n" + "="*80 + "\n\n")

print(f"Successfully extracted {len(found_phases)} phases to phases_26_to_40_extracted.txt")
