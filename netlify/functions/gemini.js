exports.handler = async function (event, context) {
  // 1. Cấu hình CORS (Để trình duyệt không chặn)
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const body = JSON.parse(event.body);
    const userMessage = body.message || "Hello";

    // 2. LẤY KEY TỪ BIẾN MÔI TRƯỜNG (BẢO MẬT)
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error(
        "Lỗi Server: Chưa cấu hình biến GEMINI_API_KEY trên Netlify.",
      );
    }

    // --- PHẦN DỮ LIỆU NỀN (CONTEXT) ---
    // Đã cập nhật chính xác từ các file txt bạn gửi
    // --- PHẦN DỮ LIỆU NỀN (CONTEXT) ĐÃ NÂNG CẤP ---
    const TEAM_DATA = `
    Dưới đây là hồ sơ các thành viên Nhóm 1 lớp K12A1 CNTT NAU.
    Hãy đóng vai là một trợ lý ảo thông minh, thấu hiểu các thành viên để trả lời người dùng.

    THÔNG TIN THÀNH VIÊN:
    1. Sầm Kim Tiến:
       - Tính cách: Hướng ngoại, nói nhiều, vui vẻ nhưng hay trì hoãn.
       - Sở thích: Bóng chuyền, gym.
       - Mục tiêu: Sự nghiệp ổn định.

    2. Hoàng Thái Việt Anh:
       - Tính cách: Hướng ngoại, tự tin nhưng dễ xúc động (dễ khóc).
       - Sở thích: Đá bóng, game, âm nhạc.
       - Điểm nhấn: Từng làm cán bộ lớp (bí thư, lớp trưởng), muốn lan truyền tin mừng.
       - Gia đình: Rất thương bố (muốn nhìn thấy bố lần nữa) và thương mẹ.

    3. Lê Đình Nguyên (Trưởng nhóm):
       - Tính cách: Hòa đồng nhưng còn hơi nhác, đôi lúc nhìn đời 1 mặt.
       - Sở thích đặc biệt: Manga, chụp ảnh phong cảnh, Đam mê công nghệ.
       - Chuyên môn: Thích Lập trình web và An ninh mạng (Security).
       - Nguyện vọng: Vào tập đoàn Viettel.

    4. Nguyễn Tiến Hưng (Lớp trưởng):
       - Tính cách: Hòa đồng, tự tin, vui tính nhưng mau cảm xúc.
       - Sở thích: Game, bóng chuyền, ca hát.
       - Kinh nghiệm lãnh đạo: Trưởng sao đỏ, Bí thư, Lớp trưởng.
       - Định hướng: Lập trình ứng dụng (App), công ty công nghệ lớn.

    CHỈ DẪN QUAN TRỌNG CHO AI (CẦN TUÂN THỦ):
    1. **Kết hợp kiến thức:** Khi người dùng hỏi, hãy dùng thông tin ở trên KẾT HỢP với kiến thức xã hội của bạn để phân tích và đưa ra lời khuyên.
       - Ví dụ: Nếu hỏi "Nguyên học bảo mật có vất vả không?", hãy trả lời đại ý: "Bảo mật (Security) là ngành rất khó và áp lực, nhưng vì Nguyên có đam mê công nghệ và mục tiêu vào Viettel nên bạn ấy sẽ có động lực để vượt qua."
    2. **Mở rộng vấn đề:** Đừng chỉ trả lời CÓ hoặc KHÔNG. Hãy gợi mở thêm câu chuyện dựa trên tính cách của họ.
    3. **Giọng điệu:** Thân thiện, như một người bạn cùng lớp, có sử dụng emoji.
    `;
    // 3. CẤU HÌNH MODEL CHUẨN (Giữ nguyên theo yêu cầu)
    const model = "gemini-2.5-flash";

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // 4. GỌI GOOGLE
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                // KẾT HỢP DỮ LIỆU NỀN + CÂU HỎI NGƯỜI DÙNG
                text: TEAM_DATA + "\n\nNgười dùng hỏi: " + userMessage,
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();

    // 5. KIỂM TRA LỖI
    if (data.error) {
      console.error("Google Error:", JSON.stringify(data.error));
      throw new Error(`Lỗi từ Google: ${data.error.message}`);
    }

    // 6. TRẢ VỀ KẾT QUẢ
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error("Lỗi:", error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
