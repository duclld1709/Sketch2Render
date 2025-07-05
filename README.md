# 🎨 Sketch to Render - Art AI

Bạn Vẽ Nét - AI Đoán Hết!
> 

---

## 🧩 **Thông tin sản phẩm**

**Sketch to Render** là một ứng dụng web AI cho phép người dùng vẽ phác thảo trực tiếp trên trình duyệt, sau đó sử dụng trí tuệ nhân tạo để:

- **Phân tích** bức vẽ: Chấm điểm chất lượng, dự đoán sự vật được vẽ.
- **Tạo ảnh render**: Sinh ra hình ảnh nghệ thuật chi tiết dựa trên phác thảo.

---

## ⚙️ **Công nghệ sử dụng**

| Thành phần | Công nghệ |
| --- | --- |
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend *(bổ sung nếu cần lưu trữ thông tin người dùng)* | Python 3, Flask |
| AI Model | Gemini API (Google Generative Language) |
| Image Generation | Pollinations API (Flux Model) |

---

## 📥 **Input**

- Người dùng vẽ trực tiếp trên **Canvas** (500x400px).
- Các tham số: Kích thước cọ, màu vẽ, undo, clear.

---

## 📤 **Output**

- **Điểm số** (1-10): Chất lượng sketch.
- **Dự đoán**: Tên sự vật được vẽ.
- **Mô tả**: Mô tả ngắn gọn bằng tiếng Anh để sinh ảnh.
- **Ảnh render**: File PNG tải về được.

---

## 🚀 **Cách chạy sản phẩm**

### ✅ **Chạy trực tiếp**

1. Clone hoặc tải repo.
2. Mở file `script.js` sau đó thay thế `this.apiKey` bằng API key của bạn.
3. Mở file `index.html` bằng trình duyệt (Chrome/Edge/Firefox).
4. Vẽ → Bấm nút **Phân tích & Tạo render** → Xem kết quả.

## 🧑‍💻 **Cách tương tác với sản phẩm**

1. **Vẽ phác thảo** bằng chuột hoặc cảm ứng.
2. Tuỳ chỉnh **màu**, **kích thước cọ**.
3. **Undo/Xoá** sketch.
4. Click **✨ Phân tích & Tạo render**.
5. Xem kết quả AI:
    - **Điểm số**
    - **Nhận diện**
    - **Ảnh render**
6. Click **📥 Tải ảnh xuống** nếu muốn lưu.

---

🚀 **Tác giả:** Lại Đức

📧 **Liên hệ:** lailedinhduc@gmail.com
