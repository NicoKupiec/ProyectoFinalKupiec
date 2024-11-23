const productos = [];

// Carga productos desde productos.json
fetch("productos.json")
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        productos.push(...data);
        mostrarProductos(productos);
    })
    .catch(error => {
        console.error("Error al cargar productos:", error);
    });

// para mejorar la búsqueda
const sinonimos = {
    camiseta: "remera",
    pantalon: "pantalón",
    camisa: "camisa",
    remera: "camiseta",
    musculosa: "top",
    jean: "vaquero",
    hombre: ["hombre", "masculino"],
    mujer: ["mujer", "femenino"]
};

const carrito = [];

// Elimina acentos y pasa a minúsculas
function normalizarPalabra(palabra) {
    const palabraSinAcentos = palabra.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return palabraSinAcentos.toLowerCase();
}

// Buscar productos
function buscarProductos() {
    const busqueda = document.getElementById("menu-buscar").value.toLowerCase().trim();
    const palabrasBusqueda = busqueda.split(" ").map(normalizarPalabra);

    const productosFiltrados = productos.filter(producto => {
        const nombreProducto = normalizarPalabra(producto.nombre);
        const tipoProducto = normalizarPalabra(producto.tipo);
        const generoProducto = normalizarPalabra(producto.genero);

        return palabrasBusqueda.every(palabra => {
            const palabrasAComparar = sinonimos[palabra] ? [palabra, sinonimos[palabra]] : [palabra];
            return palabrasAComparar.some(palabraAComparar =>
                nombreProducto.includes(palabraAComparar) ||
                tipoProducto.includes(palabraAComparar) ||
                generoProducto.includes(palabraAComparar)
            );
        });
    });

    mostrarProductos(productosFiltrados);
}

// Mostrar productos
function mostrarProductos(filtrados) {
    const contenedor = document.querySelector(".lista-productos");
    contenedor.innerHTML = "";

    if (filtrados.length === 0) {
        contenedor.innerHTML = "<p>No se encontraron productos</p>";
    } else {
        filtrados.forEach(producto => {
            contenedor.innerHTML += crearHTMLProducto(producto);
        });
    }
}

// Crear HTML para cada producto
function crearHTMLProducto(producto) {
    return `
        <div class="producto">
            <img src="${producto.imagen}" alt="${producto.nombre}">
            <h3>${producto.nombre}</h3>
            <p>${producto.tipo} para ${producto.genero}</p>
            <div class="precio">$${producto.precio}</div>
            <label for="talle-${producto.id}">Talle:</label>
            <select id="talle-${producto.id}">
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
            </select>
            <button class="boton-comprar" onclick="agregarAlCarrito(${producto.id})">Agregar al carrito</button>
        </div>
    `;
}

// Para guardar y cargar el carrito desde el localStorage
function guardarCarrito() {
    localStorage.setItem("carrito", JSON.stringify(carrito));
}


function cargarCarrito() {
    const carritoGuardado = localStorage.getItem("carrito");
    if (carritoGuardado) {
        carrito.push(...JSON.parse(carritoGuardado));
        mostrarCarrito();
    }
}

// Agregar un producto al carrito
function agregarAlCarrito(idProducto) {
    const talleSeleccionado = document.getElementById(`talle-${idProducto}`).value;
    const productoEnCarrito = carrito.find(item => item.id === idProducto && item.talle === talleSeleccionado);

    if (productoEnCarrito) {
        productoEnCarrito.cantidad += 1;
    } else {
        const producto = productos.find(p => p.id === idProducto);
        carrito.push({ ...producto, cantidad: 1, talle: talleSeleccionado });
    }

    guardarCarrito();
    mostrarCarrito();

    const contenedorCarrito = document.getElementById("carrito");
    contenedorCarrito.style.display = "block";
    // Mensaje con sweetAlert2 al agregar un producto
    Swal.fire({
        title: 'Producto agregado al carrito',
        html: `
            <p><strong>${producto.nombre}</strong></p>
            <p>Talle: ${talleSeleccionado}</p>
            <p>Precio: $${producto.precio}</p>
        `,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
    });
}

// Mostrar el contenido del carrito
function mostrarCarrito() {
    const contenedorCarrito = document.getElementById("carrito");

    contenedorCarrito.innerHTML = "";

    if (carrito.length === 0) {
        const mensajeVacio = document.createElement("p");
        mensajeVacio.textContent = "El carrito está vacío";
        mensajeVacio.style.textAlign = "center";
        mensajeVacio.style.color = "#666";
        mensajeVacio.style.marginBottom = "20px";

        contenedorCarrito.appendChild(mensajeVacio);
        // Botones Ver más productos y Realizar Pedido
        const botonesContainer = document.createElement("div");
        botonesContainer.classList.add("botones-container");

        const botonVerProductos = document.createElement("button");
        botonVerProductos.textContent = "Ver más productos";
        botonVerProductos.classList.add("btn-ver-mas");
        botonVerProductos.onclick = () => {
            contenedorCarrito.style.display = "none";
        };

        const botonPedido = document.createElement("button");
        botonPedido.textContent = "Realizar Pedido";
        botonPedido.classList.add("btn-realizar-pedido");
        botonPedido.disabled = true;
        botonPedido.style.cursor = "not-allowed";

        botonesContainer.appendChild(botonVerProductos);
        botonesContainer.appendChild(botonPedido);
        contenedorCarrito.appendChild(botonesContainer);
    } else { // Ver productos en el carrito
        let total = 0;

        carrito.forEach((producto, index) => { 
            const subtotal = producto.precio * producto.cantidad; // Para calcular subtotal por producto
            total += subtotal;

            const item = document.createElement("div");
            item.classList.add("carrito-item");
            item.innerHTML = `
                <p>${producto.nombre} (Talle: ${producto.talle}) - $${producto.precio} x ${producto.cantidad} = $${subtotal}</p>
                <button onclick="cambiarCantidad(${index}, -1)">-</button>
                <span>${producto.cantidad}</span>
                <button onclick="cambiarCantidad(${index}, 1)">+</button>
                <button onclick="eliminarDelCarrito(${index})">Eliminar</button>
            `;
            contenedorCarrito.appendChild(item);
        });
        // Muestra el total a pagar
        const totalContainer = document.createElement("div");
        totalContainer.classList.add("carrito-total");
        totalContainer.innerHTML = `<strong>Total a pagar: $${total}</strong>`;

        const botonesContainer = document.createElement("div");
        botonesContainer.classList.add("botones-container");

        const botonVerProductos = document.createElement("button");
        botonVerProductos.textContent = "Ver más productos";
        botonVerProductos.classList.add("btn-ver-mas");
        botonVerProductos.onclick = () => {
            contenedorCarrito.style.display = "none";
        };

        const botonPedido = document.createElement("button");
        botonPedido.textContent = "Realizar Pedido";
        botonPedido.classList.add("btn-realizar-pedido");
        botonPedido.onclick = mostrarVentanaPedido;
        // Agrega los botones al contenedor 
        botonesContainer.appendChild(botonVerProductos);
        botonesContainer.appendChild(botonPedido);
        totalContainer.appendChild(botonesContainer);
        contenedorCarrito.appendChild(totalContainer);
    }
}

// Para mostrar la ventana de pedido y ocultar el carrito al finalizar compra
function mostrarVentanaPedido() {
    let resumenCarrito = carrito.map(producto => {
        const subtotal = producto.precio * producto.cantidad;
        return `${producto.nombre} (Talle: ${producto.talle}) - $${producto.precio} x ${producto.cantidad} = $${subtotal}`;
    }).join('<br>');

    const total = carrito.reduce((acc, producto) => acc + producto.precio * producto.cantidad, 0);

    Swal.fire({
        title: 'Confirmar Pedido',
        html: `
            <p><strong>Resumen de Compra:</strong></p>
            <p>${resumenCarrito}</p>
            <p><strong>Total a pagar: $${total}</strong></p>
        `,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Realizar Pedido',
        cancelButtonText: 'Cancelar',
    }).then(result => {
        if (result.isConfirmed) {
            Swal.fire('Pedido realizado', 'Gracias por tu compra.', 'success');
            carrito.length = 0;
            guardarCarrito();
            mostrarCarrito();

            const contenedorCarrito = document.getElementById("carrito");
            contenedorCarrito.style.display = "none";
        }
    });
}

    // Para ver el carrito con el botón carrito
    document.getElementById("btn-ver-carrito").addEventListener("click", () => {
    const contenedorCarrito = document.getElementById("carrito");
    contenedorCarrito.style.display = "block";
    mostrarCarrito();
});

    // Vincula el evento del buscador
    document.getElementById("menu-buscar").addEventListener("input", buscarProductos);

    window.addEventListener("load", () => {
    const contenedorCarrito = document.getElementById("carrito");
    contenedorCarrito.style.display = "none";
    cargarCarrito();
});

// Cambiar cantidad en el carrito
function cambiarCantidad(index, cambio) {
    const producto = carrito[index];
    producto.cantidad += cambio;

    if (producto.cantidad <= 0) {
        eliminarDelCarrito(index);
    } else {
        guardarCarrito();
        mostrarCarrito();
    }
}

// Eliminar un producto del carrito
function eliminarDelCarrito(indice) {
    carrito.splice(indice, 1);
    guardarCarrito();
    mostrarCarrito();
}
