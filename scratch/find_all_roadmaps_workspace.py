import os
import re

workspace_dir = r"c:\Users\Dell\Desktop\Multi Vendor Ecommerce SaaS Platform"
results = []

for root, dirs, files in os.walk(workspace_dir):
    # Ignore build, dependency, and git folders
    dirs[:] = [d for d in dirs if d not in ('node_modules', '.git', '.next', 'dist', 'build', 'out', 'scratch')]
    for file in files:
        if file.endswith(('.txt', '.md', '.json', '.ts', '.tsx', '.js', '.jsx')):
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                
                # Search for Phase definitions
                for phase_num in range(15, 36):
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

with open(r"C:\Users\Dell\Desktop\Multi Vendor Ecommerce SaaS Platform\scratch\workspace_roadmaps_found.txt", "w", encoding="utf-8") as out:
    out.write(f"Total workspace matches found: {len(results)}\n")
    for idx, r in enumerate(results):
        out.write(f"\n--- Match {idx}: Phase {r['phase']} in {r['file']} ---\n")
        out.write(r['context'])
        out.write("\n" + "="*80 + "\n")

print(f"Successfully logged {len(results)} workspace matches to workspace_roadmaps_found.txt")
