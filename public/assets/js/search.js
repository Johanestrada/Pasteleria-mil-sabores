// search.js
// Módulo simple para manejar el buscador del header en todas las páginas.
(function(){
  function goSearch(term){
    const q = encodeURIComponent(term.trim());
    if(!q) {
      // si está vacío, ir a catálogo sin query
      window.location.href = '/assets/page/catalogo.html';
      return;
    }
    window.location.href = '/assets/page/catalogo.html?q=' + q;
  }

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btnBuscar');
    const input = document.getElementById('buscador');

    if(btn){
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const term = (input && input.value) ? input.value : '';
        goSearch(term);
      });
    }

    if(input){
      input.addEventListener('keypress', (e) => {
        if(e.key === 'Enter'){
          e.preventDefault();
          goSearch(input.value || '');
        }
      });
    }
  });
})();
