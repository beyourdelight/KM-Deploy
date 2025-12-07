// frontend/web/js/load-global.js
document.addEventListener("DOMContentLoaded", () => {
    loadGlobalSettings(); 
    checkAuthStatus();    
});

// 1. โหลด Logo (เหมือนเดิม)
async function loadGlobalSettings() {
    try {
        const url = `${CONFIG.API_URL}/api/global?populate=*`;
        const response = await fetch(url);
        if (!response.ok) return;

        const result = await response.json();
        const data = result.data;

        if (data) {
            if (data.navbar_logo) {
                const imgUrl = `${CONFIG.MEDIA_URL}${data.navbar_logo.url}`;
                const navLogo = document.getElementById('nav-logo');
                if (navLogo) navLogo.src = imgUrl;
            }
            if (data.footer_logo) {
                const imgUrl = `${CONFIG.MEDIA_URL}${data.footer_logo.url}`;
                const footerLogo = document.getElementById('footer-logo');
                if (footerLogo) footerLogo.src = imgUrl;
            }
        }
    } catch (error) { console.error("Global Settings Error:", error); }
}

// 2. เช็คสถานะ Login + จัดการ Logout (แก้ไขใหม่)
function checkAuthStatus() {
    const jwt = localStorage.getItem('jwt');
    const userDataStr = localStorage.getItem('user_data');
    let user = null;

    if (userDataStr) {
        try { user = JSON.parse(userDataStr); } catch(e) {}
    }
    
    // Elements
    const profileDropdown = document.querySelector('.navbar .dropdown'); 
    const profileMenu = document.querySelector('.dropdown-menu'); 
    const navbarRightSide = document.querySelector('.d-none.d-lg-flex'); 
    const mobileMenu = document.querySelector('.navbar-collapse .navbar-nav');
    
    // --- 🟢 จับปุ่ม Logout ด้วย ID (แม่นยำกว่า) ---
    const logoutBtn = document.getElementById('logoutBtn');

    if (jwt) {
        // === LOGGED IN ===
        if (profileDropdown) {
            profileDropdown.style.display = 'block';

            // เช็คว่าเป็น Staff ไหม? เพื่อเพิ่มปุ่ม Dashboard
            // แก้เป็น: เช็ค position เป็นหลัก (เพราะ Role อาจจะ populate มาไม่ถึง)
const isStaff = user && (user.position === 'Staff' || (user.role && user.role.name === 'Staff'));

            if (isStaff && !document.getElementById('dashLink')) {
                const dashLi = document.createElement('li');
                dashLi.innerHTML = `<a class="dropdown-item" id="dashLink" href="dashboard.html">Dashboard</a>`;
                profileMenu.prepend(dashLi);
            }
        }

        // ซ่อนปุ่ม Login เดิม
        const existingLoginBtn = document.getElementById('dynamicLoginBtn');
        if (existingLoginBtn) existingLoginBtn.remove();
        
        const existingMobileLogin = document.getElementById('mobileLoginLink');
        if (existingMobileLogin) existingMobileLogin.parentElement.remove();

        // --- 🟢 สั่งให้ปุ่ม Logout ทำงาน ---
        if (logoutBtn) {
            // ล้าง Event เก่าออกก่อน (เผื่อเรียกฟังก์ชันซ้ำ) แล้วใส่ใหม่
            const newLogoutBtn = logoutBtn.cloneNode(true);
            logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
            
            newLogoutBtn.addEventListener('click', (e) => {
                e.preventDefault(); // ห้ามรีเฟรชหน้า
                if(confirm('ยืนยันการออกจากระบบ?')) {
                    // ล้างข้อมูลทั้งหมด
                    localStorage.clear();
                    // ดีดไปหน้าแรก
                    window.location.href = 'index.html'; 
                }
            });
        }

    } else {
        // === GUEST ===
        if (profileDropdown) profileDropdown.style.display = 'none';

        if (navbarRightSide && !document.getElementById('dynamicLoginBtn')) {
            const loginBtn = document.createElement('a');
            loginBtn.id = 'dynamicLoginBtn';
            loginBtn.href = 'login.html';
            loginBtn.className = 'btn custom-btn btn-sm ms-3'; 
            loginBtn.innerText = 'Log In';
            navbarRightSide.appendChild(loginBtn);
        }

        if (mobileMenu && !document.getElementById('mobileLoginLink')) {
            const li = document.createElement('li');
            li.className = 'nav-item';
            li.innerHTML = '<a class="nav-link" id="mobileLoginLink" href="login.html">Log In</a>';
            mobileMenu.appendChild(li);
        }
    }
}