import os
import re

brain_dir = r"C:\Users\Dell\.gemini\antigravity\brain"
results = []

for root, dirs, files in os.walk(brain_dir):
    for file in files:
        if file.endswith(('.txt', '.md', '.json')):
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                
                # Check for Phase 22-35
                for phase_num in range(22, 36):
                    pattern = rf"Phase\s+{phase_num}\b"
                    for match in re.finditer(pattern, content, re.IGNORECASE):
                        start = max(0, match.start() - 200)
                        end = min(len(content), match.end() + 1000)
                        results.append({
                            "file": path,
                            "phase": phase_num,
                            "context": content[start:end].strip()
                        })
            except Exception as e:
                pass

results.sort(key=lambda x: (x['phase'], x['file']))

with open(r"C:\Users\Dell\Desktop\Multi Vendor Ecommerce SaaS Platform\scratch\all_roadmaps_found.txt", "w", encoding="utf-8") as out:
    out.write(f"Total matches found: {len(results)}\n")
    for idx, r in enumerate(results):
        out.write(f"\n--- Match {idx}: Phase {r['phase']} in {r['file']} ---\n")
        out.write(r['context'])
        out.write("\n" + "="*80 + "\n")

print(f"Successfully logged {len(results)} matches to all_roadmaps_found.txt")
