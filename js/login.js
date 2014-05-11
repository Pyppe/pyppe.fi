'use strict';

$(function() {
  var $form = $('#loginForm');
  var $btn = $form.find('button').prop('disabled', false);
  $form.submit(function(e) {
    e.preventDefault();
    $btn.prop('disabled', true);
    $.post('/admin/login', $form.serialize()).
        success(function() {
          window.location = '/admin';
        }).fail(function(error) {
          alert (error.responseText);
        }).always(function() {
          $btn.prop('disabled', false);
        })
  });
});