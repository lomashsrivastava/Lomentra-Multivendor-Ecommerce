import os
import re

desktop_dir = r"C:\Users\Dell\Desktop"
exclude_dir = r"c:\Users\Dell\Desktop\Multi Vendor Ecommerce SaaS Platform"

results = []
for root, dirs, files in os.walk(desktop_dir):
    if root.startswith(exclude_dir):
        continue
    for file in files:
        if file.endswith(('.txt', '.md', '.json', '.html')):
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                
                # Check for Meesho/Flipkart or Phase references
                if "meesho" in content.lower() or "flipkart" in content.lower() or "phase 2" in content.lower() or "phase 16" in content.lower():
                    print(f"Found keyword match in desktop file: {path}")
                    for phase in range(16, 36):
                        pattern = rf"Phase\s+{phase}\b"
                        if re.search(pattern, content, re.IGNORECASE):
                            results.append((path, phase))
            except Exception:
                pass

print(f"Total desktop matches: {len(results)}")
for path, phase in results:
    print(f"File {path} matches Phase {phase}")
