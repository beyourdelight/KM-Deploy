// frontend/web/js/click-scroll.js (Fixed Version)

var sectionArray = [1, 2, 3, 4, 5];

$.each(sectionArray, function(index, value){
    // ดักจับการคลิกเมนู
    $(document).on('click', '#navbar-nav .nav-item .nav-link[href*="section_' + value + '"]', function(e){
        var sectionId = 'section_' + value;
        var section = $('#' + sectionId);
        
        // ✅ เช็คก่อนว่ามี section นี้จริงไหม? ถ้าไม่มีให้หยุด (กัน Error)
        if (section.length === 0) {
            console.warn("ไม่พบ Section: " + sectionId);
            return;
        }

        e.preventDefault();
        
        // ถ้ามีจริง ค่อยสั่งเลื่อน
        var offsetTop = section.offset().top - 85;
        $('html, body').animate({
            'scrollTop': offsetTop
        }, 300);
    });

    // ดักจับการ Scroll เพื่อเปลี่ยนสีเมนู
    $(window).scroll(function(){
        var sectionId = 'section_' + value;
        var section = $('#' + sectionId);
        
        // ✅ เช็คกันพังตรงนี้ด้วย
        if (section.length === 0) return;

        var scrollPosition = $(window).scrollTop();
        var offsetTop = section.offset().top - 90;

        if (scrollPosition > offsetTop && scrollPosition < (offsetTop + section.height())) {
            $('.navbar-nav .nav-item .nav-link').removeClass('active');
            $('.navbar-nav .nav-item .nav-link[href*="section_' + value + '"]').addClass('active');
        }
    });
});

$(document).ready(function(){
    $('.navbar-nav .nav-item .nav-link').click(function(){
        $('#navbarNav').removeClass('show');
    });
});