# 🚨 Hướng Dẫn Xóa File .env Khỏi GitHub

## ⚠️ CẢNH BÁO BẢO MẬT

Nếu file `.env` đã được commit và push lên GitHub:
1. **Các secret keys đã bị lộ** → Cần đổi tất cả secret keys ngay lập tức!
2. **Xóa file khỏi Git history** → File vẫn còn trong lịch sử commit cũ
3. **Rotate tất cả credentials** → Database passwords, API keys, JWT secrets, etc.

---

## 📋 Các Bước Thực Hiện

### Bước 1: Thêm .env vào .gitignore (Nếu chưa có)

Tạo hoặc cập nhật file `.gitignore` ở root project:

```bash
# .gitignore
# Environment variables
.env
.env.local
.env.development
.env.production
.env.test

# Server .env
server/.env
server/.env.local

# Client .env
client/.env
client/.env.local

# Node modules
node_modules/
```

### Bước 2: Xóa file .env khỏi Git (Nhưng giữ lại file local)

```bash
# Xóa file khỏi Git index (nhưng giữ lại file trên máy)
git rm --cached server/.env
git rm --cached client/.env

# Hoặc xóa tất cả file .env
git rm --cached **/.env
```

### Bước 3: Commit thay đổi

```bash
git add .gitignore
git commit -m "Remove .env files from repository"
```

### Bước 4: Push lên GitHub

```bash
git push origin main
# hoặc
git push origin master
```

---

## 🔥 Xóa File Khỏi Git History (Quan Trọng!)

**Lưu ý:** File vẫn còn trong lịch sử commit cũ. Để xóa hoàn toàn, cần xóa khỏi Git history.

### Cách 1: Sử dụng git filter-branch (Cách cũ)

**⚠️ Lưu ý:** PowerShell không hỗ trợ `\` để xuống dòng. Dùng một trong các cách sau:

#### PowerShell (Viết trên 1 dòng):
```powershell
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch server/.env client/.env" --prune-empty --tag-name-filter cat -- --all
```

#### PowerShell (Dùng backtick `` ` `` để xuống dòng):
```powershell
git filter-branch --force --index-filter `
  "git rm --cached --ignore-unmatch server/.env client/.env" `
  --prune-empty --tag-name-filter cat -- --all
```

#### Bash/Unix (Dùng `\` để xuống dòng):
```bash
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch server/.env client/.env" \
  --prune-empty --tag-name-filter cat -- --all
```

### Cách 2: Sử dụng git-filter-repo (Khuyến nghị - Cách mới)

#### Cài đặt git-filter-repo:

```bash
# Windows (PowerShell)
pip install git-filter-repo

# Mac/Linux
pip3 install git-filter-repo
```

#### Xóa file khỏi history:

```bash
# Xóa file .env khỏi toàn bộ history
git filter-repo --path server/.env --invert-paths
git filter-repo --path client/.env --invert-paths

# Hoặc xóa tất cả file .env
git filter-repo --path-glob '**/.env' --invert-paths
```

### Cách 3: Sử dụng BFG Repo-Cleaner (Nhanh nhất)

#### Tải BFG: https://rtyley.github.io/bfg-repo-cleaner/

```bash
# Tạo bản sao repo
git clone --mirror https://github.com/username/repo.git

# Xóa file .env
java -jar bfg.jar --delete-files .env repo.git

# Dọn dẹp
cd repo.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Push lại
git push --force
```

---

## ⚠️ Force Push (Nguy hiểm!)

Sau khi xóa khỏi history, cần force push:

```bash
# ⚠️ CẢNH BÁO: Force push sẽ ghi đè lịch sử trên GitHub
git push origin --force --all
git push origin --force --tags
```

**Lưu ý:**
- Thông báo cho team members trước khi force push
- Họ cần clone lại repo hoặc reset local branch
- Backup repo trước khi force push

---

## 🔐 Rotate Tất Cả Secret Keys

Sau khi xóa file .env, **BẮT BUỘC** phải đổi tất cả secret keys:

### 1. Database Credentials
```bash
# Đổi password MongoDB/MySQL
# Cập nhật trong .env mới
```

### 2. JWT Secrets
```bash
# Đổi SECRET_CRYPTO
# Chạy lại generate-secret.js
node server/generate-secret.js
```

### 3. API Keys
```bash
# Đổi tất cả API keys (Google OAuth, Payment, etc.)
```

### 4. Session Secrets
```bash
# Đổi session secrets nếu có
```

---

## 📝 Checklist Hoàn Chỉnh

- [ ] Thêm `.env` vào `.gitignore`
- [ ] Xóa file `.env` khỏi Git index (`git rm --cached`)
- [ ] Commit thay đổi
- [ ] Xóa file khỏi Git history (nếu cần)
- [ ] Force push (nếu đã xóa history)
- [ ] **Rotate tất cả secret keys** ⚠️
- [ ] Thông báo team members
- [ ] Tạo file `.env.example` (không có secret keys)

---

## 🛡️ Tạo File .env.example

Tạo file mẫu để team biết cần config gì:

```bash
# server/.env.example
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/your-database
SECRET_CRYPTO=your-secret-key-here
JWT_SECRET=your-jwt-secret-here
```

```bash
# client/.env.example
VITE_API_URL=http://localhost:3000
VITE_SECRET_CRYPTO=your-secret-key-here
```

---

## 🔍 Kiểm Tra File .env Có Trong Git Không?

```bash
# Kiểm tra file .env có trong Git không
git ls-files | grep .env

# Kiểm tra file .env trong history
git log --all --full-history -- server/.env
git log --all --full-history -- client/.env
```

---

## 💡 Best Practices

1. **Luôn thêm .env vào .gitignore ngay từ đầu**
2. **Sử dụng .env.example** để hướng dẫn config
3. **Không commit file .env** dù chỉ một lần
4. **Rotate keys ngay** nếu lỡ commit
5. **Sử dụng GitHub Secrets** cho CI/CD
6. **Sử dụng environment variables** trên hosting (Vercel, Heroku, etc.)

---

## 📚 Tài Liệu Tham Khảo

- [Git Filter Branch](https://git-scm.com/docs/git-filter-branch)
- [git-filter-repo](https://github.com/newren/git-filter-repo)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)

