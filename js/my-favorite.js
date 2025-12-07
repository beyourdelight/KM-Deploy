// frontend/web/js/my-favorite.js

document.addEventListener('DOMContentLoaded', async () => {
    const jwt = localStorage.getItem('jwt');
    const container = document.getElementById('favoriteListContainer');

    if (!jwt) {
        container.innerHTML = `<div class="alert alert-warning text-center">กรุณา <a href="index.html">เข้าสู่ระบบ</a></div>`;
        return;
    }

    try {
        console.log("🚀 Loading Favorites form Custom API...");
        
        // 1. ดึง User ID ของตัวเอง (เพื่อเอาตัวเลข ID)
        const resMe = await fetch(`${CONFIG.API_URL}/api/users/me`, {
            headers: { 'Authorization': `Bearer ${jwt}` }
        });
        
        if (!resMe.ok) throw new Error('Auth Failed');
        
        const userMe = await resMe.json();
        const userId = userMe.id; // ID ตัวเลข (เช่น 15)

        // 2. ดึง Favorites จาก Custom API ของเรา (ชัวร์กว่า)
        // ยิงไปที่ /api/student-login/favorites/:id
        const response = await fetch(`${CONFIG.API_URL}/api/student-login/favorites/${userId}`);

        if (response.ok) {
            const favorites = await response.json(); // ได้ Array ของเนื้อหามาเลย
            console.log("❤️ Favorites Data:", favorites);

            // กรองตัวซ้ำ (Deduplicate) ด้วย documentId
            const uniqueFavorites = favorites.filter((item, index, self) =>
                index === self.findIndex((t) => (
                    t.documentId === item.documentId
                ))
            );

            renderList(uniqueFavorites);
        } else {
            console.error("API Error:", response.status);
            container.innerHTML = '<p class="text-center text-danger">โหลดข้อมูลไม่สำเร็จ</p>';
        }

    } catch (error) {
        console.error(error);
        container.innerHTML = '<p class="text-center text-danger">เกิดข้อผิดพลาดในการเชื่อมต่อ</p>';
    }

    function renderList(items) {
        if (!items || items.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-bookmark-heart display-1 text-muted"></i>
                    <h5 class="mt-3">ยังไม่มีรายการโปรด</h5>
                    <a href="index.html" class="btn custom-btn mt-3">ไปดูเนื้อหา</a>
                </div>`;
            return;
        }

        let html = '';
        items.forEach(item => {
            let imgUrl = 'images/topics/undraw_Remote_design_team_re_urdx.png'; 
            // เช็คทั้ง CamelCase และ snake_case
            const cover = item.coverImage || item.cover_image;
            if (cover && cover.url) {
                imgUrl = `${CONFIG.MEDIA_URL}${cover.url}`;
            }

            const hasVideo = item.videoList && item.videoList.length > 0;
            const targetId = item.documentId || item.id;
            
            const detailPage = hasVideo 
                ? `view-content.html?id=${targetId}` 
                : `topics-detail.html?id=${targetId}`;

            html += `
            <div class="custom-block custom-block-topics-listing bg-white shadow-lg mb-4">
                <div class="d-flex align-items-center">
                    <div style="width: 150px; height: 150px; flex-shrink: 0; overflow: hidden;">
                        <img src="${imgUrl}" class="img-fluid w-100 h-100" style="object-fit: cover;" alt="${item.title}">
                    </div>
                    <div class="custom-block-topics-listing-info d-flex flex-column justify-content-center w-100 p-4">
                        <div>
                            <h5 class="mb-2">
                                <a href="${detailPage}" class="text-dark text-decoration-none">${item.title}</a>
                            </h5>
                            <p class="mb-0 text-muted small text-truncate" style="max-width: 500px;">
                                ${item.description || ''}
                            </p>
                            <div class="d-flex align-items-center mt-3">
                                <a href="${detailPage}" class="btn custom-btn btn-sm me-2">Read Now</a>
                                <button onclick="removeFav('${item.documentId}')" class="btn btn-outline-danger btn-sm border-0">
                                    <i class="bi-trash me-1"></i> Remove
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        });
        container.innerHTML = html;
    }
});

// ฟังก์ชันลบ (ยิง Custom API PUT)
async function removeFav(targetDocId) {
    if(!confirm('ต้องการลบรายการนี้ใช่ไหม?')) return;
    const jwt = localStorage.getItem('jwt');
    
    try {
        // 1. ดึง User Me เพื่อเอา documentId ของคน
        const resMe = await fetch(`${CONFIG.API_URL}/api/users/me`, {
             headers: { 'Authorization': `Bearer ${jwt}` }
        });
        const userMe = await resMe.json();
        
        // 2. ดึง List ล่าสุดจาก Custom API (เพื่อให้ได้ documentId ครบๆ)
        const resFavs = await fetch(`${CONFIG.API_URL}/api/student-login/favorites/${userMe.id}`);
        const currentFavObjects = await resFavs.json();

        // 3. กรอง ID ที่จะลบออก
        const newFavList = currentFavObjects
            .filter(f => f.documentId !== targetDocId)
            .map(f => f.documentId);

        // 4. Update
        const resUpdate = await fetch(`${CONFIG.API_URL}/api/student-login/favorites`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                userDocId: userMe.documentId, 
                favorites: newFavList 
            })
        });

        if (resUpdate.ok) {
            window.location.reload(); 
        } else {
            alert('ลบไม่สำเร็จ');
        }
    } catch (err) {
        console.error(err);
        alert('เกิดข้อผิดพลาด');
    }
}