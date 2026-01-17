# 📋 Hướng Dẫn Thực Hiện Từng Bước

## ✅ Bước 1: Đã Hoàn Thành
- [x] Tạo file `.gitignore` ở root
- [x] Tạo file `server/.gitignore`
- [x] Tạo file `client/.gitignore`

## 🔍 Bước 2: Kiểm Tra .gitignore Hoạt Động

Chạy các lệnh sau trong PowerShell:

```powershell
# Kiểm tra file .env có bị ignore không
git check-ignore -v server/.env
git check-ignore -v client/.env
```

**Kết quả mong đợi:**
```
.gitignore:10:server/.env    server/.env
.gitignore:15:client/.env    client/.env
```

Nếu có output → File đã được ignore ✅

## 📝 Bước 3: Add .gitignore Vào Git

```powershell
# Add các file .gitignore
git add .gitignore
git add server/.gitignore
git add client/.gitignore

# Kiểm tra lại
git status
```

**Kết quả mong đợi:**
- Thấy `.gitignore` trong danh sách "Changes to be committed"
- KHÔNG thấy `server/.env` hoặc `client/.env` trong danh sách ✅

## ✅ Bước 4: Kiểm Tra File .env Không Bị Add

```powershell
# Kiểm tra file .env không xuất hiện trong git status
git status | Select-String ".env"
```

**Kết quả mong đợi:**
- Không có output → An toàn ✅
- Nếu có output → Cần kiểm tra lại

## 💾 Bước 5: Commit .gitignore

```powershell
# Commit các file .gitignore
git commit -m "Add .gitignore to ignore .env files and node_modules"
```

## 🧪 Bước 6: Test Thử Add Tất Cả

```powershell
# Thử add tất cả (file .env sẽ tự động bị ignore)
git add .

# Kiểm tra lại
git status | Select-String ".env"
```

**Kết quả mong đợi:**
- Không có output → Thành công ✅
- File .env sẽ không được add vào Git

## 🎯 Hoàn Thành!

Sau khi hoàn thành các bước trên:
- ✅ File `.env` sẽ không bị commit vào Git
- ✅ Có thể dùng `git add .` an toàn
- ✅ Secret keys được bảo vệ

