from pathlib import Path

ROOT_DIR = Path(".").resolve()
OUTPUT_FILE = "folder_tree.txt"

IGNORE_DIRS = {
    "node_modules",
    ".next",
    ".git",
    "dist",
    "build",
    "out",
    ".turbo",
    ".vercel",
    ".idea",
    ".vscode",
    "__pycache__",
    ".pytest_cache",
    "coverage",
    ".husky",
    ".cache",
    ".pnpm-store",
    ".yarn",
    ".parcel-cache",
    ".expo",
    ".nuxt",
    ".svelte-kit",
    "vendor",
    "tmp",
    "temp"
}

IGNORE_FILES = {
    ".DS_Store",
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml"
}

tree_lines = []

def build_tree(path: Path, prefix: str = ""):
    entries = sorted(
        [
            entry for entry in path.iterdir()
            if entry.name not in IGNORE_DIRS
            and entry.name not in IGNORE_FILES
        ],
        key=lambda e: (e.is_file(), e.name.lower())
    )

    for index, entry in enumerate(entries):
        connector = "└── " if index == len(entries) - 1 else "├── "
        tree_lines.append(f"{prefix}{connector}{entry.name}")

        if entry.is_dir():
            extension = "    " if index == len(entries) - 1 else "│   "
            build_tree(entry, prefix + extension)

tree_lines.append(ROOT_DIR.name)
build_tree(ROOT_DIR)

with open(OUTPUT_FILE, "w", encoding="utf-8") as file:
    file.write("\n".join(tree_lines))

print(f"Folder tree saved to {OUTPUT_FILE}")