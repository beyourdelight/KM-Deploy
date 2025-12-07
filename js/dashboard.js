// frontend/web/js/dashboard.js

document.addEventListener("DOMContentLoaded", async () => {
    // 1. เช็คสิทธิ์
    const jwt = localStorage.getItem('jwt');
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');

    // ตรวจสอบสิทธิ์แบบเข้มข้น
    const isStaff = userData.position === 'Staff' || (userData.role && userData.role.name === 'Staff');

    if (!jwt || !isStaff) {
        alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (สำหรับเจ้าหน้าที่เท่านั้น)');
        window.location.href = 'index.html';
        return;
    }

    // 2. เริ่มโหลดข้อมูล
    await loadDashboardStats(jwt);
});

async function loadDashboardStats(jwt) {
    try {
        // --- A. ดึงข้อมูลเนื้อหาทั้งหมด (Knowledge Items) ---
        // เรียงตามยอดวิวจากมากไปน้อย
        const resDocs = await fetch(`${CONFIG.API_URL}/api/knowledge-items?sort[0]=views:desc&populate=*&pagination[pageSize]=100`, {
            headers: { 'Authorization': `Bearer ${jwt}` }
        });
        const jsonDocs = await resDocs.json();
        const documents = jsonDocs.data || [];

        // --- B. ดึงข้อมูล User ทั้งหมด (Users) ---
        const resUsers = await fetch(`${CONFIG.API_URL}/api/users`, {
            headers: { 'Authorization': `Bearer ${jwt}` }
        });
        const users = await resUsers.json(); // Strapi user endpoint returns array directly usually

        // --- C. คำนวณตัวเลข (Calculation) ---
        
        // 1. Total Documents
        const totalDocs = documents.length; // (ถ้ามีเยอะกว่า 100 ต้องดู meta.pagination.total)
        const totalDocsReal = jsonDocs.meta?.pagination?.total || totalDocs;

        // 2. Total Views (รวมยอดวิวทุกอัน)
        const totalViews = documents.reduce((sum, item) => sum + (item.views || 0), 0);

        // 3. Total Users
        const totalUsers = Array.isArray(users) ? users.length : 0;

        // --- D. แสดงผลตัวเลข (Render Stats) ---
        document.getElementById('stat-visitors').innerText = totalUsers; // ใช้แทน Visitors Today
        document.getElementById('stat-docs').innerText = totalDocsReal;
        document.getElementById('stat-views').innerText = totalViews.toLocaleString();
        
        // --- E. วาดกราฟ (Chart.js) ---
        // เอา 5 อันดับแรกมาทำกราฟ
        const top5 = documents.slice(0, 5);
        renderChart(top5);

        // --- F. สร้างตาราง Recent Documents ---
        // เอา 5 อันดับล่าสุด (เรียงตามวันที่สร้าง) - ต้อง fetch ใหม่หรือ sort ใหม่
        // เพื่อความง่าย เราเอา list เดิมมา sort by createdAt ใน JS เลย
        const recentDocs = [...documents].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
        renderTable(recentDocs);

    } catch (error) {
        console.error("Dashboard Error:", error);
    }
}

function renderChart(items) {
    const ctx = document.getElementById('myChart');
    if (!ctx) return;

    // เตรียมข้อมูล
    const labels = items.map(item => {
        // ตัดชื่อให้สั้นลงถ้ามันยาวเกิน
        return item.title.length > 15 ? item.title.substring(0, 15) + '...' : item.title;
    });
    const dataViews = items.map(item => item.views || 0);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Views',
                data: dataViews,
                backgroundColor: '#4C83FF',
                borderRadius: 5,
                barThickness: 40
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false } // ซ่อน Legend เพราะมีสีเดียว
            },
            scales: {
                y: { 
                    beginAtZero: true, 
                    grid: { color: "#f0f0f0" } 
                },
                x: { 
                    grid: { display: false } 
                }
            }
        }
    });
}

function renderTable(items) {
    const tbody = document.querySelector('table tbody');
    if (!tbody) return;

    let html = '';
    items.forEach(item => {
        // จัดรูปแบบวันที่
        const date = new Date(item.createdAt).toLocaleDateString('th-TH', {
            day: 'numeric', month: 'short', year: '2-digit'
        });

        // ดึงหมวดหมู่ (ถ้ามี)
        const category = item.category ? item.category.name : '-'; // ปรับตามชื่อ field จริง

        html += `
            <tr>
                <td><div class="fw-bold text-truncate" style="max-width: 250px;">${item.title}</div></td>
                <td><span class="badge bg-light text-dark border">${category}</span></td>
                <td class="text-muted small">${date}</td>
                <td><span class="fw-bold text-primary">${item.views || 0}</span></td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}