// frontend/web/js/topics-detail.js

document.addEventListener("DOMContentLoaded", async () => {
    // 🛑 1. เช็คสิทธิ์ก่อนเลย (Gatekeeper)
    const jwt = localStorage.getItem('jwt');
    if (!jwt) {
        alert("กรุณาเข้าสู่ระบบเพื่อเข้าชมเนื้อหา");
        window.location.href = 'index.html'; // ดีดกลับหน้าแรก (หรือหน้า login.html)
        return; // หยุดการทำงานทุกอย่าง
    }

    // 2. ถ้ามีบัตรผ่าน ค่อยให้ทำงานต่อ
    loadTopicDetail();
});

// ==========================================
// 2. ฟังก์ชันโหลดเนื้อหาหลัก
// ==========================================
async function loadTopicDetail() {
    console.log("🏁 Start Loading Page...");
    try {
        const urlParams = new URLSearchParams(window.location.search);
        let paramId = urlParams.get('id'); 
        let apiUrl = "";

        // หา URL
        if (paramId) {
            apiUrl = `${CONFIG.API_URL}/api/knowledge-items/${paramId}?populate=*`;
        } else {
            // กรณีไม่มี ID ให้ดีดกลับหน้า Categories ดีกว่า (หรือจะดึงล่าสุดก็ได้แล้วแต่ดีไซน์)
            // window.location.href = 'categories.html'; 
            // return;
            
            // (แบบเดิม: ดึงตัวล่าสุด)
            console.warn("⚠️ ไม่พบ ID -> ดึงตัวล่าสุด");
            const res = await fetch(`${CONFIG.API_URL}/api/knowledge-items?sort[0]=createdAt:desc&pagination[pageSize]=1&populate=*`);
            const json = await res.json();
            if (json.data && json.data.length > 0) {
                paramId = json.data[0].documentId; 
                apiUrl = `${CONFIG.API_URL}/api/knowledge-items/${paramId}?populate=*`;
            } else {
                throw new Error("ไม่พบข้อมูลเนื้อหา");
            }
        }

        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("API Connection Error");
        
        const json = await response.json();
        const item = json.data;

        if (!item) throw new Error("Data is null");

        // --- เรียกใช้ฟังก์ชันย่อย ---
        initFavoriteSystem(item); 
        renderAttachments(item.attachments);

        // --- แสดงผล Views ---
        const viewCountNum = (item.views !== null && item.views !== undefined) ? item.views : 0;
        console.log("👁 Current Views:", viewCountNum);

        // --- แปะข้อมูล Text ---
        const heroTitle = document.getElementById('hero-title');
        const detailTitle = document.getElementById('detail-title');
        const titleText = item.title || 'Untitled';
        if (heroTitle) heroTitle.innerText = titleText;
        if (detailTitle) detailTitle.innerText = titleText;

        const contentDiv = document.getElementById('detail-content');
        if (contentDiv) contentDiv.innerHTML = renderRichText(item.content);

        // (ถ้ามีรูปภาพอื่นนอกจาก Attachments ก็จัดการตรงนี้ได้)

        // สั่งนับยอดวิว (+1)
        incrementViewCount(item.documentId);

    } catch (error) {
        console.error("Error:", error);
        const hero = document.getElementById('hero-title');
        if(hero) hero.innerText = "Error Loading Content";
    }
}

// ฟังก์ชันนับยอดวิว
async function incrementViewCount(docId) {
    try {
        await fetch(`${CONFIG.API_URL}/api/knowledge-items/${docId}/increment-view`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) { console.warn("View inc failed", e); }
}

// Helper: แปลง Rich Text
function renderRichText(blocks) {
    if (!blocks) return "";
    return blocks.map(b => {
        if (b.type === 'paragraph' || !b.type) return `<p>${b.children.map(c => c.text).join('')}</p>`;
        if (b.type === 'heading') return `<h${b.level} class="mt-4 mb-3">${b.children.map(c => c.text).join('')}</h${b.level}>`;
        if (b.type === 'list') {
            const tag = b.format === 'ordered' ? 'ol' : 'ul';
            const items = b.children.map(li => `<li>${li.children.map(c=>c.text).join('')}</li>`).join('');
            return `<${tag}>${items}</${tag}>`;
        }
        return "";
    }).join('');
}

// ==========================================
// 4. ฟังก์ชันแสดงไฟล์แนบ
// ==========================================
function renderAttachments(attachments) {
    const container = document.getElementById('attachments-container');
    if (!container) return;
    if (!attachments || attachments.length === 0) {
        container.innerHTML = '<p class="text-muted small">ไม่มีเอกสารแนบ</p>';
        return;
    }

    let html = '';
    attachments.forEach(file => {
        const fileUrl = `${CONFIG.MEDIA_URL}${file.url}`;
        const fileName = file.name;
        const fileExt = file.ext.toLowerCase();
        const fileSize = (file.size).toFixed(2) + ' KB';

        let iconClass = 'bi-file-earmark-text'; 
        let iconColor = 'text-secondary';

        if (fileExt.includes('pdf')) { iconClass = 'bi-file-earmark-pdf-fill'; iconColor = 'text-danger'; } 
        else if (fileExt.match(/(jpg|jpeg|png|gif|webp)$/)) { iconClass = 'bi-file-earmark-image-fill'; iconColor = 'text-primary'; } 
        else if (fileExt.match(/(doc|docx)$/)) { iconClass = 'bi-file-earmark-word-fill'; iconColor = 'text-primary'; } 
        else if (fileExt.match(/(xls|xlsx|csv)$/)) { iconClass = 'bi-file-earmark-excel-fill'; iconColor = 'text-success'; } 
        else if (fileExt.match(/(ppt|pptx)$/)) { iconClass = 'bi-file-earmark-slides-fill'; iconColor = 'text-warning'; } 
        else if (fileExt.match(/(zip|rar)$/)) { iconClass = 'bi-file-earmark-zip-fill'; iconColor = 'text-dark'; }

        html += `
        <a href="${fileUrl}" target="_blank" class="text-decoration-none text-dark">
            <div class="card border mb-2 shadow-sm hover-effect" style="border: 1px solid #dee2e6;">
                <div class="card-body p-3 d-flex align-items-center">
                    <div class="me-3"><i class="${iconClass} ${iconColor}" style="font-size: 2rem;"></i></div>
                    <div class="flex-grow-1">
                        <h6 class="mb-0 text-dark fw-bold" style="font-size: 1rem;">${fileName}</h6>
                        <small class="text-muted text-uppercase">${fileExt.replace('.','')} File • ${fileSize}</small>
                    </div>
                    <div class="text-muted"><i class="bi bi-box-arrow-up-right"></i></div>
                </div>
            </div>
        </a>`;
    });
    container.innerHTML = html;
}

// ==========================================
// 3. ระบบ Favorite (Version Custom API)
// ==========================================
async function initFavoriteSystem(contentItem) {
    const contentDocId = contentItem.documentId;
    const jwt = localStorage.getItem('jwt');
    const favoriteBtn = document.getElementById('favoriteBtn');
    if (!favoriteBtn || !contentDocId) return;

    const btnText = favoriteBtn.querySelector('span');
    const btnIcon = favoriteBtn.querySelector('i');
    let currentFavDocIds = []; 
    let userDocId = null;

    // เช็คสถานะ (Load State)
    try {
        const res = await fetch(`${CONFIG.API_URL}/api/users/me?populate[favorites][fields][0]=documentId`, {
            headers: { 'Authorization': `Bearer ${jwt}` }
        });
        if (res.ok) {
            const user = await res.json();
            userDocId = user.documentId;
            const favorites = user.favorites || [];
            currentFavDocIds = favorites.map(f => f.documentId);
            
            const isFav = currentFavDocIds.includes(contentDocId);
            updateBtnUI(isFav);
        }
    } catch (err) { console.error(err); }

    function updateBtnUI(isFav) {
        if (isFav) {
            if(btnText) btnText.innerText = 'Remove from Favorite';
            if(btnIcon) { btnIcon.classList.remove('bi-bookmark'); btnIcon.classList.add('bi-bookmark-fill'); }
            favoriteBtn.classList.add('btn-secondary');
        } else {
            if(btnText) btnText.innerText = 'Add to Favorite';
            if(btnIcon) { btnIcon.classList.remove('bi-bookmark-fill'); btnIcon.classList.add('bi-bookmark'); }
            favoriteBtn.classList.remove('btn-secondary');
        }
    }

    favoriteBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        // ปุ่ม Favorite ไม่ต้องเช็ค Login ซ้ำแล้ว เพราะถ้าไม่ Login จะเข้าหน้านี้ไม่ได้ตั้งแต่แรก
        if (!userDocId) return; 

        const isFavNow = btnIcon.classList.contains('bi-bookmark-fill');
        let newFavs = isFavNow ? currentFavDocIds.filter(id => id !== contentDocId) : [...currentFavDocIds, contentDocId];

        try {
            favoriteBtn.style.pointerEvents = 'none';
            if(btnText) btnText.innerText = 'Processing...';

            const res = await fetch(`${CONFIG.API_URL}/api/student-login/favorites`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userDocId: userDocId, favorites: newFavs })
            });

            if (res.ok) {
                currentFavDocIds = newFavs;
                updateBtnUI(!isFavNow);
            } else { throw new Error('Failed'); }
        } catch (err) { alert('Failed to save'); updateBtnUI(isFavNow); } 
        finally { favoriteBtn.style.pointerEvents = 'auto'; }
    });
}