$(function() {
  var myScroll = new iScroll('wrapper');
  console.log('window.innerHeight : ' + $(window).height());
  console.log('window.innerWidth : ' + $(window).width());
  $('.outer-wrapper').width($(window).width()).height($(window).height());
  $('body').on('touchstart touchend touchmove touchcancel', function(e) {
    // e.preventDefault();
  });
});

