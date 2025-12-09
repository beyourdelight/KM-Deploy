// frontend/web/js/main.js

async function loadFeaturedSection() {
    const container = document.getElementById('featured-container');
    if (!container) return; 

    try {
        //ดึง 3 อันดับแรก (views สูงสุด)
        const response = await fetch(`${CONFIG.API_URL}/api/knowledge-items?sort[0]=views:desc&pagination[pageSize]=3&populate=*`);
        const result = await response.json();
        const items = result.data;

        if (!items || items.length === 0) {
            container.innerHTML = '<div class="col-12"><p class="text-center">ไม่พบข้อมูลยอดนิยม</p></div>';
            return;
        }

        let htmlContent = '';

        items.forEach((item) => {
            // หารูปภาพ
            const imgUrl = item.coverImage 
                ? `${CONFIG.MEDIA_URL}${item.coverImage.url}` 
                : 'images/topics/undraw_Remote_design_team_re_urdx.png'; 

            // เช็ค Logic ลิงก์ 
            // ถ้ามีวิดีโอ (videoList มีข้อมูล) -> ไปหน้า view-content.html
            // ถ้าไม่มีวิดีโอ (เป็นบทความ) -> ไปหน้า topics-detail.html
            const hasVideo = item.videoList && item.videoList.length > 0;
            const linkUrl = hasVideo 
                ? `view-content.html?id=${item.documentId}` 
                : `topics-detail.html?id=${item.documentId}`;

            //  สร้างการ์ด 
            htmlContent += `
                <div class="col-lg-4 col-md-6 col-12 mb-4 mb-lg-0">
                    <div class="custom-block bg-white shadow-lg h-100">
                        <a href="${linkUrl}" class="d-block text-decoration-none">
                            
                            <div style="height: 200px; overflow: hidden; border-radius: 10px 10px 0 0;">
                                <img src="${imgUrl}" class="img-fluid w-100 h-100" 
                                    style="object-fit: cover;" 
                                    alt="${item.title}">
                            </div>

                            <div class="p-4">
                                <h5 class="mb-2 text-dark text-truncate">${item.title}</h5>
                                <p class="mb-0 text-muted" style="font-size: 0.9rem;">
                                    ${hasVideo ? 'รับชมวิดีโอ (Video)' : 'อ่านรายละเอียด (Read More)'}
                                </p>
                            </div>
                        </a>
                    </div>
                </div>
            `;
        });

        container.innerHTML = htmlContent;

    } catch (error) {
        console.error("Error loading featured section:", error);
    }
}

// สั่งทำงาน
loadFeaturedSection();