document.addEventListener('DOMContentLoaded', () => {
    
    // ตัวแปรสำหรับเก็บ ID ของ User ปัจจุบัน
    let currentUserId = null;

    // 1. ตรวจสอบ Token
    const jwt = localStorage.getItem('jwt');
    if (!jwt) {
        window.location.href = 'index.html'; // หรือ register.html
        return;
    }

    // 2. ฟังก์ชันดึงข้อมูล User (และจำ ID)
    // async function fetchUserProfile() {
    //     try {
    //         const response = await fetch('http://localhost:1337/api/users/me', {
    //             method: 'GET',
    //             headers: {
    //                 'Authorization': `Bearer ${jwt}`
    //             }
    //         });
        async function fetchUserProfile() {
        try {
            const response = await fetch(`${CONFIG.API_URL}/api/users/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${jwt}`
                }
            });

            if (response.ok) {
                const user = await response.json();
                
                // *** สำคัญ: จำ ID ไว้ใช้งานตอนเปลี่ยนรหัส ***
                currentUserId = user.id;

                // แสดงข้อมูลบนหน้าเว็บ
                const fNameEl = document.getElementById('displayFirstName');
                const lNameEl = document.getElementById('displayLastName');
                const emailEl = document.getElementById('displayEmail');

                if(fNameEl) fNameEl.textContent = user.first_name || '-';
                if(lNameEl) lNameEl.textContent = user.last_name || '-';
                if(emailEl) emailEl.textContent = user.email || '-';

            } else {
                handleLogout();
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    }

    // 3. จัดการเรื่อง Change Password
    const changePassForm = document.getElementById('changePasswordForm');

    if (changePassForm) {
        changePassForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // เช็คว่าโหลดข้อมูล User เสร็จหรือยัง (มี ID หรือยัง)
            if (!currentUserId) {
                alert('กรุณารอข้อมูล User โหลดสักครู่ หรือรีเฟรชหน้าเว็บ');
                return;
            }

            const newPassword = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm_password').value;
            const submitBtn = changePassForm.querySelector('button[type="submit"]');

            if (newPassword !== confirmPassword) {
                alert('รหัสผ่านยืนยันไม่ตรงกัน');
                return;
            }
            if (newPassword.length < 6) {
                alert('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
                return;
            }

            try {
                submitBtn.innerText = 'Updating...';
                submitBtn.disabled = true;
                // const response = await fetch(`http://localhost:1337/api/users/${currentUserId}`, {
                //     method: 'PUT',
                //     headers: {
                //         'Content-Type': 'application/json',
                //         'Authorization': `Bearer ${jwt}`
                //     },
                //     body: JSON.stringify({
                //         password: newPassword
                //     })
                // });
                const response = await fetch(`${CONFIG.API_URL}/api/users/${currentUserId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${jwt}`
                    },
                    body: JSON.stringify({
                        password: newPassword
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    alert('เปลี่ยนรหัสผ่านสำเร็จ!');
                    document.getElementById('password').value = '';
                    document.getElementById('confirm_password').value = '';
                } else {
                    alert('เกิดข้อผิดพลาด: ' + (data.error?.message || 'เปลี่ยนรหัสผ่านไม่ได้'));
                }

            } catch (error) {
                console.error(error);
                alert('เชื่อมต่อ Server ไม่ได้');
            } finally {
                submitBtn.innerText = 'Update Password';
                submitBtn.disabled = false;
            }
        });
    }

    // 4. Logout
    function handleLogout() {
        localStorage.removeItem('jwt');
        localStorage.removeItem('user_data');
        window.location.href = 'index.html'; 
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // เริ่มทำงาน
    fetchUserProfile();
});