import os

brain_dir = r"C:\Users\Dell\.gemini\antigravity\brain"
print("Subdirectories under brain:")
for item in os.listdir(brain_dir):
    path = os.path.join(brain_dir, item)
    if os.path.isdir(path):
        print(f"Directory: {item}")
