$(function() {
  $("#showMoreNostalgia").prop('disabled', false).click(function() {
    $(this).off("click").prop('disabled', true);
    $("#moreNostalgia").slideDown();
    $('html, body').animate({scrollTop: $('#moreNostalgia').offset().top}, 400);
  });
});