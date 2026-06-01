import os

desktop_dir = r"c:\Users\Dell\Desktop"
matches = []

for file in os.listdir(desktop_dir):
    if file.endswith('.txt'):
        path = os.path.join(desktop_dir, file)
        try:
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                if "161" in content or "Phase 17" in content or "Multi-Vendor" in content:
                    matches.append((file, len(content)))
        except Exception as e:
            pass

print(f"Found {len(matches)} files on Desktop:")
for m in matches:
    print(f"  {m[0]} ({m[1]} bytes)")
