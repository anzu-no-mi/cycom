// ハンバーガーメニュー開閉
document.addEventListener('DOMContentLoaded', function() {
  var toggle = document.getElementById('navbar-toggle');
  var menu = document.getElementById('navbar-menu');
  if (toggle && menu) {
    toggle.addEventListener('click', function() {
      menu.classList.toggle('open');
      toggle.classList.toggle('open');
    });
  }
});
