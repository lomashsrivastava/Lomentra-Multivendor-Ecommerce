import os
import re

brain_dir = r"C:\Users\Dell\.gemini\antigravity\brain"
results = []

search_terms = ["Meesho", "Flipkart", "Multi-Vendor E-Commerce SaaS", "Phase 16", "Phase 20", "Phase 22", "Phase 26", "Roadmap"]

for root, dirs, files in os.walk(brain_dir):
    for file in files:
        if file.endswith(('.txt', '.md', '.json')):
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                
                for term in search_terms:
                    if term.lower() in content.lower():
                        # Find occurrences
                        for match in re.finditer(re.escape(term), content, re.IGNORECASE):
                            start = max(0, match.start() - 100)
                            end = min(len(content), match.end() + 500)
                            results.append({
                                "file": path,
                                "term": term,
                                "context": content[start:end].strip()
                            })
            except Exception:
                pass

print(f"Total matches found: {len(results)}")
# Write them to a file grouped by file
grouped = {}
for r in results:
    if r['file'] not in grouped:
        grouped[r['file']] = []
    grouped[r['file']].append(r)

with open(r"C:\Users\Dell\Desktop\Multi Vendor Ecommerce SaaS Platform\scratch\broad_search_results.txt", "w", encoding="utf-8") as out:
    for filename, matches in grouped.items():
        out.write(f"\n=================== File: {filename} ===================\n")
        # Keep unique contexts to avoid massive files
        seen_contexts = set()
        for m in matches:
            clean_context = m['context'][:300].strip()
            if clean_context not in seen_contexts:
                seen_contexts.add(clean_context)
                out.write(f"\n[Term: {m['term']}]\n{m['context']}\n")
                out.write("-" * 40 + "\n")

print("Broad search results logged to broad_search_results.txt")
