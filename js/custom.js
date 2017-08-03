
 
$(document).ready(function() {
    "use strict";

  //open and close popup
    _functions.openPopup = function(foo){
        $('.popup-content').removeClass('active');
        $('.popup-wrapper, .popup-content[data-rel="'+foo+'"]').addClass('active');
        $('html').addClass('overflow-hidden');
    };

    _functions.closePopup = function(){
        $('.popup-wrapper, .popup-content').removeClass('active');
        $('html').removeClass('overflow-hidden');
        $('.video-popup .popup-iframe').html('');
    };

    $(document).on('click', '.open-popup', function(e){
        _functions.openPopup($(this).data('rel'));
        return false;
    });

    $(document).on('click', '.popup-wrapper .button-close, .popup-wrapper .layer-close', function(e){
        _functions.closePopup();
        return false;
    });

    //video popup
    $('.open-video').on('click', function(e){
        $('.video-popup .popup-iframe').html('<iframe src="'+$(this).data('src')+'"></iframe>');
        $('.popup-wrapper').addClass('active');
        $('.video-popup').addClass('active');
        return false;
    });

    //open ajax  popup
    $(document).on('click', '.open-popup-ajax', function(e){
        e.preventDefault();
        $('html').addClass('overflow-hidden');
        $('.popup-content').removeClass('active');
        $('.popup-wrapper').addClass('active');
        var url = $(this).attr('href');
        $.ajax({
            type:"GET",
            async:true,
            url: url,
            success:function(response){
                var responseObject = $($.parseHTML(response));
                $('.ajax-popup .swiper-container').each(function(){
                    swipers['swiper-'+$(this).attr('id')].destroy();
                    delete swipers['swiper-'+$(this).attr('id')];
                });
                $('.ajax-popup').remove();
                $('.popup-wrapper').append(responseObject.addClass('ajax-popup'));
                _functions.initSwiper();
                responseObject.addClass('active');
                _functions.initSelect();
            }
        });
        return false;
    });

 
});

