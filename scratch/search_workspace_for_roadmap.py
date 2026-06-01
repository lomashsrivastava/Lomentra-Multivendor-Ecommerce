import os
import re

workspace_dir = r"C:\Users\Dell\Desktop\Multi Vendor Ecommerce SaaS Platform"

matches = []
for root, dirs, files in os.walk(workspace_dir):
    # Exclude directories
    dirs[:] = [d for d in dirs if d not in ('node_modules', '.git', 'dist', '.next', 'scratch', 'brain', '.gemini')]
    for file in files:
        if file.endswith(('.txt', '.md', '.json', '.html', '.ts', '.tsx', '.js', '.jsx')):
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                if "phase 2" in content.lower() or "phase 1" in content.lower():
                    print(f"File matches: {path}")
                    for phase in range(20, 36):
                        pattern = rf"Phase\s+{phase}\b"
                        if re.search(pattern, content, re.IGNORECASE):
                            print(f"  -> Found Phase {phase}")
            except Exception as e:
                pass
