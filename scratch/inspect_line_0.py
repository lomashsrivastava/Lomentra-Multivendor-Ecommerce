import json
import re

log_path = r"C:\Users\Dell\.gemini\antigravity\brain\bc1fa028-9695-467a-b867-3efa8d0f67b7\.system_generated\logs\overview.txt"

with open(log_path, 'r', encoding='utf-8', errors='ignore') as f:
    line_0 = f.readline()

try:
    data = json.loads(line_0)
    content = data.get("content", "")
    print(f"Original content length: {len(content)}")
    
    # Save the original prompt text to a file so we can view it
    with open(r"C:\Users\Dell\Desktop\Multi Vendor Ecommerce SaaS Platform\scratch\original_prompt.txt", "w", encoding="utf-8") as out:
        out.write(content)
    
    # Find all matches of Phase followed by numbers up to 50
    matches = re.findall(r"Phase\s+\d+[\s\S]{1,400}", content, re.IGNORECASE)
    print(f"Found {len(matches)} Phase mentions in prompt.")
    
    # Find Phases 26, 27, 28, 29, 30
    target_phases = [26, 27, 28, 29, 30]
    results = []
    for p in target_phases:
        pattern = rf"Phase\s+{p}\b[\s\S]{1,600}"
        found = re.findall(pattern, content, re.IGNORECASE)
        if found:
            results.append((p, found[0]))
            
    with open(r"C:\Users\Dell\Desktop\Multi Vendor Ecommerce SaaS Platform\scratch\roadmap_targets.txt", "w", encoding="utf-8") as out:
        for p, text in results:
            out.write(f"\n=================== PHASE {p} ===================\n")
            out.write(text)
            out.write("\n" + "="*50 + "\n")
            
    print("Roadmap target phases written to roadmap_targets.txt")

except Exception as e:
    print("Error parsing JSON:", e)
