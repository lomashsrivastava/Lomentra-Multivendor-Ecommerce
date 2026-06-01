import os
import re

desktop_dir = r"c:\Users\Dell\Desktop"
brain_dir = r"C:\Users\Dell\.gemini\antigravity\brain"

results = []

# 1. Search top level files on desktop
for file in os.listdir(desktop_dir):
    if file.endswith(('.txt', '.md', '.json')):
        path = os.path.join(desktop_dir, file)
        try:
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            # Look for Phase 26 to 35
            matches = re.findall(r"(?:Phase\s+(?:22|23|24|25|26|27|28|29|30|31|32|33|34|35|36|37|38|39|40))[\s\S]{1,400}", content, re.IGNORECASE)
            if matches:
                results.append({
                    "file": path,
                    "matches": matches
                })
        except Exception:
            pass

# 2. Search only log files / walkthroughs / plans in brain directory
for root, dirs, files in os.walk(brain_dir):
    for file in files:
        if file in ['overview.txt', 'walkthrough.md', 'implementation_plan.md']:
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                matches = re.findall(r"(?:Phase\s+(?:26|27|28|29|30|31|32|33|34|35|36|37|38|39|40))[\s\S]{1,400}", content, re.IGNORECASE)
                if matches:
                    results.append({
                        "file": path,
                        "matches": matches
                    })
            except Exception:
                pass

print(f"Found {len(results)} files with matches.")
for r in results:
    print(f"\n--- File: {r['file']} ---")
    for m in r['matches']:
        print(f"Match: {m.strip()}\n")
