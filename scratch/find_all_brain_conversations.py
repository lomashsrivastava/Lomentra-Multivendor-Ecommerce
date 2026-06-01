import os
import re

brain_dir = r"C:\Users\Dell\.gemini\antigravity\brain"
results = []

if os.path.exists(brain_dir):
    for folder in os.listdir(brain_dir):
        folder_path = os.path.join(brain_dir, folder)
        if os.path.isdir(folder_path):
            log_file = os.path.join(folder_path, ".system_generated", "logs", "overview.txt")
            if os.path.exists(log_file):
                try:
                    with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
                        for line_num, line in enumerate(f):
                            if "Phase 26" in line or "Phase 27" in line or "Phase 30" in line:
                                print(f"Found match in conversation {folder}, line {line_num}")
                                results.append((folder, line_num, line[:1000]))
                except Exception as e:
                    print(f"Error reading {log_file}: {e}")

print(f"Done. Found {len(results)} matches.")
