// show-password.js
// Busca botones con la clase .btn-show-password y alterna el tipo del input objetivo
(function(){
  function toggleVisibility(btn){
    const selector = btn.getAttribute('data-target');
    if (!selector) return;
    const input = document.querySelector(selector);
    if (!input) return;
    const icon = btn.querySelector('i');
    if (input.type === 'password') {
      input.type = 'text';
      if (icon) { icon.classList.remove('bi-eye'); icon.classList.add('bi-eye-slash'); }
      btn.setAttribute('aria-pressed','true');
    } else {
      input.type = 'password';
      if (icon) { icon.classList.remove('bi-eye-slash'); icon.classList.add('bi-eye'); }
      btn.setAttribute('aria-pressed','false');
    }
    input.focus();
  }

  document.addEventListener('DOMContentLoaded', function(){
    document.querySelectorAll('.btn-show-password').forEach(btn => {
      btn.addEventListener('click', () => toggleVisibility(btn));
    });
  });
})();