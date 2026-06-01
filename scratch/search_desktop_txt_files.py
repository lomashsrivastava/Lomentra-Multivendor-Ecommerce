import os
import re

desktop_dir = r"C:\Users\Dell\Desktop"

for file in os.listdir(desktop_dir):
    path = os.path.join(desktop_dir, file)
    if os.path.isfile(path) and file.endswith(('.txt', '.md', '.json')):
        try:
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            if "meesho" in content.lower() or "flipkart" in content.lower() or "phase" in content.lower():
                print(f"File matches: {file} (length {len(content)})")
                # print any mentions of Phase 20 to 35
                for phase in range(20, 36):
                    pattern = rf"Phase\s+{phase}\b"
                    if re.search(pattern, content, re.IGNORECASE):
                        print(f"  -> Found reference to Phase {phase}")
        except Exception as e:
            print(f"Error reading {file}: {e}")
