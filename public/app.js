async function loadProducts(){
  const res = await fetch('/api/products');
  const data = await res.json();
  const div = document.getElementById('content');
  div.innerHTML = '<h2>Catálogo</h2>';
  data.forEach(p=>{
    div.innerHTML += `
      <div class="product">
        <img src="${p.image}" width="120">
        <h3>${p.name}</h3>
        <p>${p.description}</p>
        <strong>$${p.price}</strong>
      </div>`;
  });
}

function showAbout(){
  document.getElementById('content').innerHTML="<h2>Nosotros</h2><p>Somos una tienda moderna especializada en robótica y electrónica.</p>";
}

function showCart(){
  document.getElementById('content').innerHTML="<h2>Carrito</h2><p>Aquí aparecerán los productos añadidos.</p>";
}
