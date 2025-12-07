// js/search.js

document.addEventListener("DOMContentLoaded", async () => {
    // 1. ดึงคำค้นหาจาก URL (เช่น ?keyword=การเงิน)
    const params = new URLSearchParams(window.location.search);
    const keyword = params.get('keyword');
    
    const container = document.getElementById('search-container');
    const titleEl = document.getElementById('search-title');

    // ถ้าไม่มีคำค้นหา ให้เด้งกลับหน้าแรก หรือแจ้งเตือน
    if (!keyword) {
        titleEl.innerText = "กรุณาระบุคำค้นหา";
        container.innerHTML = '<div class="col-12 text-center"><p>คุณยังไม่ได้ระบุคำค้นหา</p></div>';
        return;
    }

    // อัปเดตหัวข้อให้รู้ว่าหาคำว่าอะไร
    titleEl.innerText = `ผลการค้นหา: "${keyword}"`;

    try {
        console.log(`🔍 Searching for: ${keyword}`);

        // 2. เรียก API Strapi (ใช้ Filter $containsi = contains case-insensitive)
        // ค้นหาใน field 'title'
        const apiUrl = `${CONFIG.API_URL}/api/knowledge-items?filters[title][$containsi]=${keyword}&populate=*&sort[0]=createdAt:desc`;
        
        const response = await fetch(apiUrl);
        const result = await response.json();
        const items = result.data;

        if (!items || items.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="bi bi-search display-1 text-muted"></i>
                    <h4 class="mt-4">ไม่พบข้อมูล</h4>
                    <p class="text-muted">ลองค้นหาด้วยคำอื่น หรือใช้คำที่กว้างขึ้น</p>
                    <a href="index.html" class="btn custom-btn mt-3">กลับหน้าแรก</a>
                </div>`;
            return;
        }

        // 3. สร้างการ์ดแสดงผล (ใช้ Template เดียวกับ Latest Updates ที่เราทำสวยๆ ไว้)
        let htmlContent = '';

        items.forEach(item => {
            // Helper: หารูป, หาลิงก์, จัดวันที่
            const imgUrl = item.coverImage 
                ? `${CONFIG.MEDIA_URL}${item.coverImage.url}` 
                : 'images/topics/undraw_Remote_design_team_re_urdx.png';

            const hasVideo = item.videoList && item.videoList.length > 0;
            const linkUrl = hasVideo 
                ? `view-content.html?id=${item.documentId}` 
                : `topics-detail.html?id=${item.documentId}`;
            
            const dateStr = new Date(item.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });

            htmlContent += `
                <div class="col-lg-4 col-md-6 col-12 mb-4">
                    <div class="custom-block bg-white shadow-lg h-100 border-0" style="border-radius: 15px; overflow: hidden;">
                        <a href="${linkUrl}" class="d-block text-decoration-none">
                            <div class="position-relative" style="height: 200px;">
                                <img src="${imgUrl}" class="w-100 h-100" style="object-fit: cover;" alt="${item.title}">
                                <span class="position-absolute top-0 end-0 m-2 badge bg-light text-dark shadow-sm">${dateStr}</span>
                            </div>
                            <div class="p-4">
                                <h5 class="mb-2 text-dark text-truncate">${item.title}</h5>
                                <p class="mb-3 text-muted" style="font-size: 0.9rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                                    ${item.description || 'ไม่มีรายละเอียดเพิ่มเติม'}
                                </p>
                                <span class="text-primary fw-bold small">
                                    ${hasVideo ? '<i class="bi-play-circle-fill"></i> วิดีโอ' : '<i class="bi-file-text-fill"></i> บทความ'}
                                </span>
                            </div>
                        </a>
                    </div>
                </div>
            `;
        });

        container.innerHTML = htmlContent;

    } catch (error) {
        console.error("Search Error:", error);
        container.innerHTML = '<div class="col-12 text-center text-danger"><p>เกิดข้อผิดพลาดในการค้นหา</p></div>';
    }
});