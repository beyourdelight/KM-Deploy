// js/register.js

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');

    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault(); // ป้องกันหน้าเว็บรีเฟรช(ให้เว้บมันส่ง background เอง)

            //ดึงค่าจาก Input
            const buasri_code = document.getElementById('buasriInput').value;
            const email = document.getElementById('emailInput').value;
            const password = document.getElementById('passwordInput').value;

            // เตรียมข้อมูลส่งไปหา Strapi
            // const API_URL = 'http://localhost:1337/api/student-login/register';
            const API_URL = `${CONFIG.API_URL}/api/student-login/register`;

            try {
                // เปลี่ยนปุ่มเป็นสถานะกำลังโหลด
                const submitBtn = registerForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerText;
                submitBtn.innerText = 'Signing Up...';
                submitBtn.disabled = true;

                //ยิง Request ไปที่ API
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json' 
                    },
                    body: JSON.stringify({ 
                        buasri_code: buasri_code, 
                        email: email, 
                        password: password 
                    })
                });

                const data = await response.json(); // รับผลลัพธ์กลับมา

                // ตรวจสอบผลลัพธ์
                if (response.ok) {
                    // สำเร็จ: บันทึก Token ลงเครื่อง
                    localStorage.setItem('jwt', data.jwt);
                    
                    alert('ลงทะเบียนสำเร็จ!');
                    // ย้ายไปหน้า Profile
                    window.location.href = 'profile.html'; 
                } else {
                    // ไม่สำเร็จ: แสดง Error จาก Backend
                    alert('เกิดข้อผิดพลาด: ' + (data.error ? data.error.message : 'Unknown error'));
                }

                // คืนค่าปุ่มกลับมาเหมือนเดิม
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;

            } catch (error) {
                console.error('Error:', error);
                alert('ไม่สามารถเชื่อมต่อกับ Server ได้');
            }
        });
    }
});