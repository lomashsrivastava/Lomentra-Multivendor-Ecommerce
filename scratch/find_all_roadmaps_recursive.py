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
                
                # Check for Phase 22-30
                for phase_num in range(22, 35):
                    pattern = rf"Phase\s+{phase_num}\b"
                    for match in re.finditer(pattern, content, re.IGNORECASE):
                        start = max(0, match.start() - 200)
                        end = min(len(content), match.end() + 600)
                        results.append({
                            "file": path,
                            "phase": phase_num,
                            "context": content[start:end].strip()
                        })
            except Exception as e:
                pass

print(f"Total matches found: {len(results)}")
# Sort matches by phase number
results.sort(key=lambda x: (x['phase'], x['file']))

# Print first 20 matches to see what they are
for r in results[:30]:
    print(f"\n--- Phase {r['phase']} in {os.path.basename(r['file'])} ---")
    print(r['context'])
    print("-" * 50)
