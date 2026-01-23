// --- 0. CẤU HÌNH FIREBASE (BẠN PHẢI THAY THÔNG TIN CỦA BẠN VÀO ĐÂY) ---
const firebaseConfig = {
  apiKey: "AIzaSyBJkcfBwSAdlLjN06o0EvL8m52vENyZ_mI",
  authDomain: "portfolio-k12a1-nau.firebaseapp.com",
  projectId: "portfolio-k12a1-nau",
  storageBucket: "portfolio-k12a1-nau.firebasestorage.app",
  messagingSenderId: "537336340193",
  appId: "1:537336340193:web:5b56c6757d4503e86aa1a0",
  measurementId: "G-DJEXWJ223V",
};

// Khởi tạo Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// --- 1. DỮ LIỆU MẶC ĐỊNH (FALLBACK) & TIN TỨC ---
let membersData = {}; // Sẽ load từ DB

const newsData = [
  {
    id: 1,
    type: "featured",
    title: "Trường Đại Học NGhệ AN",
    thumb:
      "https://naue.edu.vn/Images/userfiles/Slider/Slider-131-12-25-21-02-29.png",
    desc: "Trường Đại Học Nghệ An Chúc Mừng NĂm Mới 2026",
    url: "https://naue.edu.vn/",
  },
  {
    id: 2,
    type: "normal",
    title: "Quy chế tuyển sinh ",
    thumb:
      "https://naue.edu.vn/Images/userfiles/Thumbs/2026-1/thong-14-1-26-08-53.png",
    url: "https://naue.edu.vn/quy-che-tuyen-sinh-445/thong--8845.aspx",
  },
  {
    id: 3,
    type: "normal",
    title:
      "Trường Đại học Kinh tế Nghệ An đạt chuẩn 3 sao plus theo định hướng ứng dụng của hệ thống xếp hạng đối sánh chất lượng đại học (UPM)",
    thumb:
      "https://naue.edu.vn/Images/userfiles/85/Contents/b%c3%aca%202(2).jpg",
    url: "https://naue.edu.vn/tieu-diem-su-kien-562/truong-dai-hoc-kinh-te-nghe-an-dat-chuan-3-sao-plus-theo-dinh-huong-ung-dung-cua-he-thong-xep-hang-doi-sanh-chat-luong-dai-hoc--6673.aspx",
  },
  {
    id: 4,
    type: "normal",
    title: "Thông báo : Tuyển sinh năm 2026",
    thumb:
      "https://naue.edu.vn/Images/userfiles/Slider/Slider-25-1-26-10-40-56.png",
    url: "https://xettuyen.nau.edu.vn/",
  },
  {
    id: 5,
    type: "normal",
    title: "Tạp chí khoa học",
    thumb:
      "https://naue.edu.vn/Images/userfiles/Thumbs/2025-6/thong-bao-moi-viet-bai-30-6-25-16-25.png",
    url: "https://naue.edu.vn/tap-chi-khoa-hoc-566/Default.aspx",
  },
];

// --- 2. KHỞI TẠO & LOAD DỮ LIỆU ---
document.addEventListener("DOMContentLoaded", async () => {
  // 2.1 Load Nav
  await loadMembersFromDB();

  // 2.2 Load News
  renderNews();

  // 2.3 Setup Events
  setupThemeToggle();
  setupAdminLogin();
  setupModalEvents();
});

// --- LOAD MEMBERS TỪ FIREBASE ---
async function loadMembersFromDB() {
  const navContainer = document.getElementById("nav-members");
  navContainer.innerHTML = '<p style="font-size:0.7rem;">Loading...</p>';

  try {
    const snapshot = await db.collection("members").get();

    // Nếu DB rỗng (Lần đầu chạy), nạp dữ liệu mẫu
    if (snapshot.empty) {
      console.log("DB trống, đang nạp dữ liệu mẫu...");
      seedData();
      return;
    }

    navContainer.innerHTML = "";
    membersData = {}; // Reset local cache

    snapshot.forEach((doc) => {
      const data = doc.data();
      membersData[doc.id] = data; // Lưu vào cache để dùng hiển thị

      // Render Avatar Nav
      const img = document.createElement("img");
      img.src = data.avatar || "https://via.placeholder.com/50";
      img.className = "nav-avatar";
      img.title = data.name;
      img.onclick = () => openProfilePage(doc.id);
      navContainer.appendChild(img);
    });
  } catch (error) {
    console.error("Lỗi tải data:", error);
    navContainer.innerHTML = "Err";
  }
}

// --- 3. PROFILE PAGE LOGIC (FULL SCREEN) ---
let currentMemberId = null;
let isEditMode = false;

function openProfilePage(id) {
  const member = membersData[id];
  if (!member) return;

  currentMemberId = id;
  const page = document.getElementById("profile-page");

  // Fill Data (Hiển thị dữ liệu)
  document.getElementById("p-avatar").src = member.avatar;
  setText("p-name", member.name);
  setText("p-role", member.role);
  setText("p-dob", member.dob);
  setText("p-from", member.from);

  // HTML content
  setHTML("p-exp", member.exp);
  setHTML("p-project", member.project || "Chưa cập nhật");
  setHTML("p-goal", member.goal);

  // Phần mới thêm lại
  setText("p-pros", member.pros); // Ưu điểm
  setText("p-cons", member.cons); // Nhược điểm

  setText("p-hobby", member.hobby);
  setText("p-hate", member.hate);

  // Reset Edit Mode
  disableEditMode();
  page.classList.remove("hidden");
}

function setText(id, val) {
  document.getElementById(id).innerText = val || "";
}
function setHTML(id, val) {
  document.getElementById(id).innerHTML = val || "";
}

// Đóng trang Profile
document.getElementById("back-home-btn").onclick = () => {
  document.getElementById("profile-page").classList.add("hidden");
  disableEditMode();
};

// --- 4. ADMIN / EDIT LOGIC (Yêu cầu 0 & 1) ---
function setupAdminLogin() {
  document.getElementById("admin-login-btn").onclick = () => {
    // Kiểm tra xem đang mở profile nào không
    const pageHidden = document
      .getElementById("profile-page")
      .classList.contains("hidden");

    if (pageHidden) {
      alert("Vui lòng chọn một thành viên trước để cập nhật thông tin!");
      return;
    }

    // Hỏi mã Key
    const key = prompt("Nhập mã truy cập (Access Key) của bạn:");

    // Logic kiểm tra Key đơn giản (Thực tế nên lưu hash trên server)
    // Quy ước: Key = id + "123" (Ví dụ: nguyen123)
    if (key === currentMemberId + "123") {
      enableEditMode();
    } else {
      alert("Sai mã truy cập! Bạn không có quyền sửa hồ sơ này.");
    }
  };

  // Nút Lưu
  document.getElementById("save-profile-btn").onclick = saveProfileChanges;
}

function enableEditMode() {
  isEditMode = true;
  alert(
    `Đã bật chế độ chỉnh sửa cho: ${membersData[currentMemberId].name}\nBạn có thể nhấn vào văn bản để sửa.`,
  );

  document.getElementById("save-profile-btn").classList.remove("hidden");
  document.getElementById("edit-avatar-btn").classList.remove("hidden-edit");

  // Bật contenteditable
  const editables = document.querySelectorAll(".editable");
  editables.forEach((el) => el.setAttribute("contenteditable", "true"));
}

function disableEditMode() {
  isEditMode = false;
  document.getElementById("save-profile-btn").classList.add("hidden");
  document.getElementById("edit-avatar-btn").classList.add("hidden-edit");
  const editables = document.querySelectorAll(".editable");
  editables.forEach((el) => el.setAttribute("contenteditable", "false"));
}

async function saveProfileChanges() {
  if (!currentMemberId) return;

  const updates = {};
  const editables = document.querySelectorAll(".editable");

  editables.forEach((el) => {
    const field = el.getAttribute("data-field");
    // Nếu là content box thì lấy innerHTML, text ngắn thì innerText
    if (["exp", "project", "goal"].includes(field)) {
      updates[field] = el.innerHTML;
    } else {
      updates[field] = el.innerText;
    }
  });

  try {
    await db.collection("members").doc(currentMemberId).update(updates);

    // Cập nhật lại local cache
    Object.assign(membersData[currentMemberId], updates);

    alert("Lưu thành công! Dữ liệu đã được cập nhật vĩnh viễn.");
    disableEditMode();
  } catch (error) {
    alert("Lỗi khi lưu: " + error.message);
  }
}

// Xử lý upload ảnh (Demo - chuyển sang Base64 để lưu vào Firestore)
// Lưu ý: Firestore giới hạn 1MB/doc. Tốt nhất nên dùng Firebase Storage nhưng code sẽ dài hơn.
// Ở đây dùng Base64 cho đơn giản, ảnh phải nhỏ.
document
  .getElementById("avatar-upload")
  .addEventListener("change", function () {
    if (this.files && this.files[0]) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target.result;
        document.getElementById("p-avatar").src = base64;
        // Lưu luôn ảnh
        if (currentMemberId) {
          await db
            .collection("members")
            .doc(currentMemberId)
            .update({ avatar: base64 });
          membersData[currentMemberId].avatar = base64;
          // Reload lại list avatar bên ngoài
          loadMembersFromDB();
        }
      };
      reader.readAsDataURL(this.files[0]);
    }
  });

// --- 5. RENDER NEWS & MODAL (Yêu cầu 5 & 6) ---
function renderNews() {
  const grid = document.getElementById("news-grid");
  grid.innerHTML = "";

  newsData.forEach((news) => {
    const item = document.createElement("div");
    item.className = `news-item ${news.type === "featured" ? "featured" : ""}`;
    item.innerHTML = `
            <img src="${news.thumb}" class="news-thumb" alt="${news.title}">
            <div class="news-info">
                <h3>${news.title}</h3>
                ${news.type === "featured" ? "<p>Xem chi tiết &rarr;</p>" : ""}
            </div>
        `;
    item.onclick = () => openNewsModal(news);
    grid.appendChild(item);
  });
}

function openNewsModal(news) {
  const modal = document.getElementById("news-modal");
  document.getElementById("news-title-modal").innerText = news.title;

  const container = document.getElementById("news-iframe-container");
  container.innerHTML = ""; // Clear cũ

  // Nếu có URL, thử load iframe (hoặc link dự phòng)
  if (news.url) {
    container.innerHTML = `
            <p>Đang tải bài viết từ: ${news.url}</p>
            <p style="font-size: 0.9rem; color: #666;">(Nếu không hiển thị, trang web này chặn nhúng. <a href="${news.url}" target="_blank">Mở tab mới</a>)</p>
            <iframe src="${news.url}" title="News"></iframe>
        `;
  } else {
    container.innerHTML = "<p>Nội dung bài viết đang cập nhật...</p>";
  }

  modal.classList.remove("hidden");
}

function setupModalEvents() {
  document.getElementById("close-news").onclick = () => {
    document.getElementById("news-modal").classList.add("hidden");
  };
  // Click outside to close
  window.onclick = (e) => {
    const modal = document.getElementById("news-modal");
    if (e.target == modal) modal.classList.add("hidden");
  };
}

// --- 6. THEME TOGGLE (Yêu cầu 4) ---
function setupThemeToggle() {
  const btn = document.getElementById("theme-toggle");
  const body = document.body;
  const icon = btn.querySelector("i");

  // Kiểm tra local storage
  if (localStorage.getItem("theme") === "dark") {
    body.setAttribute("data-theme", "dark");
    icon.className = "fas fa-sun";
  }

  btn.onclick = () => {
    if (body.getAttribute("data-theme") === "dark") {
      body.removeAttribute("data-theme");
      icon.className = "fas fa-moon";
      localStorage.setItem("theme", "light");
    } else {
      body.setAttribute("data-theme", "dark");
      icon.className = "fas fa-sun";
      localStorage.setItem("theme", "dark");
    }
  };
}

// --- UTILS: SEED DATA (Chạy 1 lần đầu để tạo DB) ---
// --- DỮ LIỆU GỐC ĐẦY ĐỦ (Dùng để reset database) ---
async function seedData() {
  console.log("Đang nạp lại toàn bộ dữ liệu gốc...");

  const members = [
    {
      id: "nguyen",
      name: "Lê Đình Nguyên",
      role: "Web Dev & Security",
      dob: "26/01/2007",
      from: "Vạn An, Nghệ An",
      hobby: "Manga, ảnh chụp phong cảnh, tìm hiểu công nghệ",
      hate: "Lợi dụng, boy phố ngầu, nói dối",
      pros: "Ai cũng là bạn",
      cons: "Nhác, chưa thực sự nỗ lực, đôi lúc chỉ nhìn vấn đề 1 mặt",
      exp: "Hiện chưa cập nhật chi tiết (Đang tập trung học Web/Security)",
      goal: "Là một lập trình viên web và an ninh mạng. Kiếm tiền nuôi bố mẹ. Mong muốn làm việc tại Viettel.",
      project: "Portfolio AI, Chatbot System",
      avatar: "images/nguyen.jpg",
    },
    {
      id: "hung",
      name: "Nguyễn Tiến Hưng",
      role: "Lớp trưởng - App Dev",
      dob: "19/06/2007",
      from: "Lam Thành, Nghệ An",
      hobby: "Chơi game, bóng chuyền, âm nhạc (nghe, hát)",
      hate: "Giả tạo, boy phố",
      pros: "Hòa đồng, vui tính, tự tin",
      cons: "Nhác, chưa thực sự nỗ lực, người mau cảm xúc",
      exp: "2020-2022: Trưởng sao đỏ. 2023-2024: Bí thư đoàn trường. Nay: Bí thư chi đoàn địa phương.",
      goal: "Có công việc ổn định, kiếm tiền nuôi bố mẹ. Mong muốn lập trình ứng dụng tại công ty công nghệ uy tín.",
      project: "App quản lý lớp học",
      avatar: "images/hung.jpg",
    },
    {
      id: "vietanh",
      name: "Hoàng Thái Việt Anh",
      role: "Inspirer (Người truyền tin)",
      dob: "17/01/2007",
      from: "Xã Quỳnh Anh, Nghệ An",
      hobby: "Đá bóng, chơi game, tập gym, nghe nhạc",
      hate: "Sự im lặng, không gian kín, ngoài mặt vui tươi trong lòng ghét bỏ",
      pros: "Hướng ngoại, nói nhiều, tự tin",
      cons: "Trì hoãn công việc, chưa tập trung, dễ khóc",
      exp: "Việc gì cũng làm (Bí thư, lớp trưởng, sao đỏ, tổ trưởng, xứ đoàn phó)",
      goal: "Không để mẹ phải khóc nữa. Ước mơ: Được nhìn thấy bố một lần nữa, là người loan truyền tin mừng.",
      project: "Dự án cộng đồng",
      avatar: "images/vietanh.jpg",
    },
    {
      id: "tien",
      name: "Sầm Kim Tiến",
      role: "Chuyên viên Tập đoàn",
      dob: "25/01/2007",
      from: "Mường Quàng, Nghệ An",
      hobby: "Bóng chuyền, tập gym, thể thao",
      hate: "Ngoài mặt vui tươi trong lòng ghét bỏ",
      pros: "Hướng ngoại, nói nhiều",
      cons: "Trì hoãn công việc, chưa tập trung",
      exp: "Thành tích tốt trong các hoạt động thể thao và phong trào.",
      goal: "Sự nghiệp ổn định, cố gắng hơn từng ngày, thành công theo ngành đã chọn. Làm ở các tập đoàn lớn uy tín.",
      project: "Startup thể thao",
      avatar: "images/tien.jpg",
    },
  ];

  // Ghi đè lên Firebase
  const promises = members.map((m) =>
    db.collection("members").doc(m.id).set(m),
  );
  await Promise.all(promises);

  alert("Đã khôi phục xong 4 thành viên! Trang web sẽ tự tải lại.");
  location.reload();
}

// Chatbot UI Toggle (Giữ nguyên logic cũ)
document.getElementById("chat-toggle-btn").onclick = () =>
  document.getElementById("chat-window").classList.remove("hidden");
document.getElementById("close-chat").onclick = () =>
  document.getElementById("chat-window").classList.add("hidden");

// ======================================================
// 7. PHẦN CODE CHATBOT (BỊ THIẾU - DÁN VÀO CUỐI FILE)
// ======================================================
const userInput = document.getElementById("user-input");
const chatContent = document.getElementById("chat-content");
const sendBtn = document.getElementById("send-btn");

// Gắn sự kiện Click cho nút Gửi
if (sendBtn) {
  sendBtn.onclick = handleChat;
}

// Gắn sự kiện nhấn Enter
if (userInput) {
  userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleChat();
  });
}

async function handleChat() {
  const text = userInput.value.trim();
  if (!text) return;

  // 1. Hiện tin nhắn của bạn lên màn hình
  addMsg(
    text,
    "user-message",
    "text-align: right; background: #dbeafe; padding: 8px; border-radius: 5px; margin: 5px 0; margin-left: auto; width: fit-content; max-width: 80%;",
  );
  userInput.value = ""; // Xóa ô nhập

  // 2. Hiện trạng thái "Đang nhập..."
  const loadingMsg = addMsg(
    "AI đang suy nghĩ...",
    "bot-message",
    "background: #f1f5f9; padding: 8px; border-radius: 5px; margin: 5px 0; width: fit-content; font-style: italic; color: #666;",
  );

  // 3. Gọi về Server Netlify để hỏi Gemini
  try {
    const reply = await callGemini(text);

    // Cập nhật câu trả lời vào ô đang load
    loadingMsg.innerText = reply;
    loadingMsg.style.fontStyle = "normal";
    loadingMsg.style.color = "#000";
  } catch (error) {
    loadingMsg.innerText = "Lỗi: " + error.message;
    loadingMsg.style.color = "red";
  }
}

// Hàm vẽ bong bóng chat
function addMsg(text, className, style) {
  const div = document.createElement("div");
  div.className = className;
  div.style = style; // Style inline để đảm bảo hiện đúng màu
  div.innerText = text;
  chatContent.appendChild(div);
  chatContent.scrollTop = chatContent.scrollHeight; // Tự cuộn xuống đáy
  return div;
}

// Hàm kết nối Server
async function callGemini(message) {
  try {
    const response = await fetch("/.netlify/functions/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message }),
    });

    if (!response.ok) {
      throw new Error(
        "Server Netlify chưa phản hồi (Code " + response.status + ")",
      );
    }

    const data = await response.json();

    // Lấy câu trả lời từ cấu trúc JSON của Google
    return (
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "AI không có câu trả lời."
    );
  } catch (e) {
    console.error(e);
    return "Lỗi kết nối: Hãy kiểm tra lại API Key trên Netlify.";
  }
}
