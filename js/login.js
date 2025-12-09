document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // ป้องกันหน้าเว็บรีเฟรช(ให้เว้บมันส่ง background เอง)

            // 1. รับค่าจากฟอร์ม
            const identifier = document.getElementById('loginIdentifier').value;
            const password = document.getElementById('loginPassword').value;
            const submitBtn = loginForm.querySelector('button[type="submit"]');

            try {
                // เปลี่ยนปุ่มเป็นสถานะกำลังโหลด
                const originalText = submitBtn.innerText;
                submitBtn.innerText = 'Logging in...';
                submitBtn.disabled = true;

                // const response = await fetch('http://localhost:1337/api/auth/local', {
                const response = await fetch(`${CONFIG.API_URL}/api/auth/local`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        identifier: identifier, // strapi รับได้ทั้ง email และ username
                        password: password
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    // 3. ล็อกอินสำเร็จ -> บันทึก Token
                    localStorage.setItem('jwt', data.jwt);
                    localStorage.setItem('user_data', JSON.stringify(data.user));
                    
                    // ดีดไปหน้าแรก
                    alert('เข้าสู่ระบบสำเร็จ ยินดีต้อนรับ!');
                    window.location.href = 'index.html'; 
                } else {
                    // 4. ล็อกอินไม่ผ่าน
                    alert('เข้าสู่ระบบไม่สำเร็จ: ' + (data.error?.message || 'รหัสผ่านไม่ถูกต้อง'));
                }
            } catch (error) {
                console.error(error);
                alert('ไม่สามารถเชื่อมต่อ Server ได้');
            } finally {
                // คืนค่าปุ่ม
                submitBtn.innerText = 'Login';
                submitBtn.disabled = false;
            }
        });
    }
});