# 🌱 Groot – A Lightweight Git-like Version Control System

Groot is a minimal yet functional version control system that allows you to `init`, `add`, `commit`, view `log`s, and even see `diff`s between commits — all without using Git. It operates using its own `.groot` directory to manage files, commits, and content snapshots.

---

## ✨ Features

- 🔧 Initialize a new `.groot` repository
- ➕ Add files to staging
- 📝 Commit changes with messages
- 🧾 View commit history (log)
- 🧩 View diffs between commits (with colored output)
- 🛑 Tracks parent commits like a linked list
- 🔐 Uses SHA-1 hashing for content IDs

---

## 🚀 Getting Started

### 1. Make the Script Executable

At the top of your `groot.js` file, ensure you have the following line to tell the system it's a Node.js executable:

```js
#!/usr/bin/env node
chmod +x groot.js
./groot.js
```

---

## 🛠️ Usage Commands

### 🔹 Add a file to staging

```bash
./groot.js add sample.txt
```

### 🔹 Commit changes

```bash
./groot.js commit "Initial commit"
```

### 🔹 View commit history
```bash
./groot.js log
```

### 🔹 Show file diffs for a specific commit


```bash
./groot.js show <commit_hash>
```

✅ Shows changes with colored output:

- 🟩 **Green** for additions  
- 🟥 **Red** for deletions  
- 🟨 **Yellow** for unchanged lines




