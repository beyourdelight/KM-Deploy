document.addEventListener("DOMContentLoaded", async () => {
    // 🛑 1. เช็คสิทธิ์ (Gatekeeper)
    const jwt = localStorage.getItem('jwt');
    if (!jwt) {
        alert("กรุณาเข้าสู่ระบบเพื่อเข้าชมเนื้อหา");
        window.location.href = 'index.html';
        return;
    }

    // 2. ถ้าผ่าน ให้โหลดเนื้อหา
    await loadVideoContent();
});

// ==========================================
// 1. ฟังก์ชันโหลดเนื้อหาหลัก (Video Content)
// ==========================================
async function loadVideoContent() {
    const urlParams = new URLSearchParams(window.location.search);
    let docId = urlParams.get('id');

    if (!docId) {
        console.error("❌ Missing Content ID");
        return;
    }

    window.copyNasPath = function(path) {
        navigator.clipboard.writeText(path).then(() => alert('คัดลอกที่อยู่ไฟล์แล้ว: ' + path));
    };

    try {
        console.log(`🚀 Loading Content ID: ${docId}`);
        
        // Construct URL
        let apiUrl = `${CONFIG.API_URL}/api/knowledge-items/${docId}`;
        apiUrl += `?populate[videoList][populate]=directFile`; 
        apiUrl += `&populate[attachments]=true`;               
        apiUrl += `&populate[coverImage]=true`;                

        console.log("🔗 Fetching Manual URL:", apiUrl);
        
        const response = await fetch(apiUrl);

        if (!response.ok) { 
            console.warn("⚠️ Complex URL failed, trying simple populate...");
            const simpleUrl = `${CONFIG.API_URL}/api/knowledge-items/${docId}?populate=*`;
            const fallbackRes = await fetch(simpleUrl);
            if (!fallbackRes.ok) throw new Error(`API Error: ${response.status}`);
            
            // Logic: ถ้า Plan A พัง (เช่น เขียน Path ผิด หรือ Server ตอบ Error 400) ให้ใช้ Plan B
            const fallbackJson = await fallbackRes.json();
            processData(fallbackJson.data); 
            return;
        }
        
        const json = await response.json();
        processData(json.data);

    } catch (error) {
        console.error("🔥 Error Loading Content:", error);
        const playerContainer = document.getElementById('video-player-container');
        if(playerContainer) playerContainer.innerHTML = `<div class="text-white p-3 text-center">Error loading content<br><small>${error.message}</small></div>`;
    }
}

// แยกฟังก์ชันออกมาเพื่อให้เรียกใช้ซ้ำได้ (Clean Code)
function processData(item) {
    // --- 2. เรียกใช้ฟังก์ชันย่อย ---
    if (typeof initFavoriteSystem === 'function') initFavoriteSystem(item);
    if (typeof renderAttachments === 'function') renderAttachments(item.attachments);

    // --- 3. แปะข้อมูล Text (Title) ---
    const heroTitle = document.getElementById('hero-title');
    if (heroTitle) heroTitle.innerText = item.title || 'Untitled';

    const contentTitle = document.getElementById('content-title');
    if (contentTitle) contentTitle.innerText = item.title || 'Untitled';
    const itemContent = item.content || item.description;
    
    // --- 🔥 แก้ไขจุดที่ 1: ใช้ item.content และผ่าน renderRichText ---
    const contentBody = document.getElementById('content-body');
    if (contentBody) {
        // ลองแปลง Content (Rich Text) ก่อน ถ้าไม่มีค่อยไปเอา Description
        const richTextHtml = renderRichText(item.content);
        
        if (richTextHtml) {
            contentBody.innerHTML = richTextHtml;
        } else {
            // Fallback กรณีไม่มี content ให้ใช้ description
            contentBody.innerHTML = item.description ? item.description.replace(/\n/g, '<br>') : '-';
        }
    }
    
    // --- 4. Logic ยอดวิว ---
    const viewCount = document.getElementById('view-count');
    const viewCountNum = (item.views !== null && item.views !== undefined) ? item.views : 0;
    if (viewCount) viewCount.innerText = `${viewCountNum} Views`;

    // --- 5. Logic Video Player ---
    const playerContainer = document.getElementById('video-player-container');
    const videoList = item.videoList || [];

    console.log("🎬 Video List Data:", videoList);

    // ตรวจสอบความถูกต้องของ Element และเคลียร์เนื้อหา/Class เก่าก่อนเริ่มทำงาน
    if (!playerContainer) {
        console.error("❌ Video Player Container ID 'video-player-container' not found.");
        return;
    }
    
    // 🔥 1. เคลียร์เนื้อหาและ Class เริ่มต้น (Spinner, Background)
    playerContainer.innerHTML = ''; 
    playerContainer.classList.remove('bg-dark', 'd-flex', 'align-items-center', 'justify-content-center', 'bg-light'); 
    playerContainer.classList.add('ratio', 'ratio-16x9'); // ใส่ ratio กลับเข้าไปเป็นค่าเริ่มต้น

    if (videoList.length > 0) {
        const video = videoList[0];
        
        if (video.sourceType === 'Direct') {
                if (video.directFile && video.directFile.url) {
                    const fileUrl = `${CONFIG.MEDIA_URL}${video.directFile.url}`;
                    const mimeType = video.directFile.mime || 'video/mp4';
                    
                    playerContainer.innerHTML = `
                    <video width="100%" height="100%" controls controlsList="nodownload" style="background:black; max-height: 500px;">
                        <source src="${fileUrl}" type="${mimeType}">
                        Your browser does not support the video tag.
                    </video>`;
                } else {
                    playerContainer.innerHTML = `<div class="text-white text-center p-5">Video file not found</div>`;
                }

        } else if (video.externalUrl) {
                const getEmbed = (url) => {
                    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
                    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
                };
                const embedUrl = getEmbed(video.externalUrl);
                
                if(embedUrl) {
                    playerContainer.innerHTML = `<iframe width="100%" height="100%" src="${embedUrl}" frameborder="0" allowfullscreen></iframe>`;
                } else {
                    playerContainer.innerHTML = `<div class="text-white text-center p-5"><a href="${video.externalUrl}" target="_blank" class="btn btn-light">Open Link</a></div>`;
                }

        } else if (video.sourceType === 'NAS' && video.nasPath) {
            
            const safePath = video.nasPath.replace(/\\/g, '\\\\');
            playerContainer.innerHTML = `
            <div class="text-center p-5 h-100 d-flex flex-column justify-content-center align-items-center">
                <i class="bi bi-hdd-network display-1 text-secondary"></i>
                <h5 class="mt-3 text-dark">Video on NAS</h5>
                <div class="input-group mb-3 mt-3 w-75">
                    <input type="text" class="form-control" value="${video.nasPath}" readonly>
                    <button class="btn btn-primary" onclick="window.copyNasPath('${safePath}')">Copy Path</button>
                </div>
            </div>`;
            // สำหรับ NAS ควรใช้พื้นหลังสีอ่อน (bg-light) แทน
            playerContainer.classList.add('bg-light', 'd-flex', 'align-items-center', 'justify-content-center'); 
            
        } else {
            // ไม่ระบุ Source Type
            playerContainer.innerHTML = `<div class="text-white h-100 d-flex align-items-center justify-content-center">Video data incomplete or unknown source type.</div>`;
            playerContainer.classList.add('bg-dark', 'd-flex', 'align-items-center', 'justify-content-center'); 
        }
    } else {
        // ไม่มี Video List เลย
        playerContainer.innerHTML = `<div class="text-white h-100 d-flex align-items-center justify-content-center">No video available in item data.</div>`;
        playerContainer.classList.add('bg-dark', 'd-flex', 'align-items-center', 'justify-content-center');
    }

    // สั่งนับยอดวิว (+1)
    incrementViewCount(item.documentId);
// } <-- ไม่ต้องมี } ตรงนี้ เพราะอยู่ใน processData เดิม
// ฟังก์ชันนับยอดวิว
async function incrementViewCount(docId) {
    try {
        await fetch(`${CONFIG.API_URL}/api/knowledge-items/${docId}/increment-view`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) { console.warn("View inc failed", e); }
}
// ==========================================
// Helper: แปลง Rich Text Blocks (สำหรับ Description)
// ==========================================
function renderRichText(blocks) {
    if (!blocks) return "";
    return blocks.map(b => {
        // ตรวจสอบว่ามี children ก่อน
        const textContent = b.children && b.children.length > 0 ? b.children.map(c => c.text).join('') : '';

        if (b.type === 'paragraph' || !b.type) return `<p>${textContent}</p>`;
        if (b.type === 'heading') return `<h${b.level} class="mt-4 mb-3">${textContent}</h${b.level}>`;
        if (b.type === 'list') {
            const tag = b.format === 'ordered' ? 'ol' : 'ul';
            const items = b.children.map(li => `<li>${li.children && li.children.map(c=>c.text).join('')}</li>`).join('');
            return `<${tag}>${items}</${tag}>`;
        }
        return "";
    }).join('');
}
// ==========================================
// 🔌 Helper Function: Render Rich Text (Strapi V5 Blocks)
// ==========================================
function renderRichText(content) {
    if (!content) return '';
    
    // ถ้าเป็น Array (Blocks Editor ของ Strapi V5)
    if (Array.isArray(content)) {
        return content.map(block => {
            switch (block.type) {
                case 'paragraph':
                    return `<p>${block.children.map(child => child.text).join('')}</p>`;
                case 'heading':
                    return `<h${block.level}>${block.children.map(child => child.text).join('')}</h${block.level}>`;
                case 'list':
                    const tag = block.format === 'ordered' ? 'ol' : 'ul';
                    const items = block.children.map(item => `<li>${item.children.map(c => c.text).join('')}</li>`).join('');
                    return `<${tag}>${items}</${tag}>`;
                case 'image':
                    return `<img src="${block.image.url}" alt="${block.image.alternativeText || ''}" class="img-fluid my-3" />`;
                case 'quote':
                    return `<blockquote class="blockquote">${block.children.map(c => c.text).join('')}</blockquote>`;
                case 'code':
                    return `<pre><code>${block.children.map(c => c.text).join('')}</code></pre>`;
                default:
                    return '';
            }
        }).join('');
    } 
    
    // กรณีเป็น String ธรรมดา (Markdown หรือ Plain text)
    return String(content).replace(/\n/g, '<br>');
}

// ==========================================
// 4. ฟังก์ชันแสดงไฟล์แนบ (Attachments)
// ==========================================
function renderAttachments(attachments) {
    const container = document.getElementById('attachments-container');
    if (!container) return;
    
    if (!attachments || attachments.length === 0) {
        container.innerHTML = '<p class="text-muted small ms-2"> - ไม่มีเอกสารแนบ - </p>';
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

        // ตรวจสอบนามสกุลไฟล์เพื่อกำหนดไอคอน
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

    if (!jwt) return;

    try {
        const res = await fetch(`${CONFIG.API_URL}/api/users/me?populate[favorites][fields][0]=documentId`, {
            headers: { 'Authorization': `Bearer ${jwt}` }
        });
        
        if (res.ok) {
            const user = await res.json();
            userDocId = user.documentId;
            const favorites = user.favorites || [];
            currentFavDocIds = favorites.map(f => f.documentId);
            
            updateBtnUI(currentFavDocIds.includes(contentDocId));
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
        if (!userDocId) { alert('Please Login'); return; }

        const isFavNow = btnIcon.classList.contains('bi-bookmark-fill');
        let newFavs = isFavNow ? currentFavDocIds.filter(id => id !== contentDocId) : [...currentFavDocIds, contentDocId];

        try {
            favoriteBtn.style.pointerEvents = 'none';
            if(btnText) btnText.innerText = 'Processing...';

            const res = await fetch(`${CONFIG.API_URL}/api/student-login/favorites`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userDocId: userDocId, 
                    favorites: newFavs 
                })
            });

            if (res.ok) {
                currentFavDocIds = newFavs;
                updateBtnUI(!isFavNow);
            } else { throw new Error('Failed'); }
        } catch (err) { 
            console.error(err); 
            alert('Failed to save');
            updateBtnUI(isFavNow); 
        } 
        finally { favoriteBtn.style.pointerEvents = 'auto'; }
    });
}
}