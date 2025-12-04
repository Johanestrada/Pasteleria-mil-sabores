// ==================== GESTIÓN DE REPORTES ====================

class ReportesManager {
    constructor() {
        this.db = null;
        this.inicializarFirebase();
    }

    inicializarFirebase() {
        try {
            if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
                this.db = firebase.firestore();
                console.log('Firebase listo para Reportes');
            }
        } catch (error) {
            console.error('Error inicializando Firebase para reportes:', error);
        }
    }

    // Generar reporte de ventas por período
    async generarReportePorPeriodo() {
        try {
            const fechaInicio = document.getElementById('fechaInicio').value;
            const fechaFin = document.getElementById('fechaFin').value;

            if (!fechaInicio || !fechaFin) {
                alert('Por favor selecciona un período válido');
                return;
            }

            const inicio = new Date(fechaInicio);
            const fin = new Date(fechaFin);
            fin.setHours(23, 59, 59, 999);

            if (inicio > fin) {
                alert('La fecha de inicio no puede ser mayor que la fecha de fin');
                return;
            }

            // Mostrar carga
            document.getElementById('reporte-ventas').innerHTML = '<p class="loading">Cargando datos...</p>';
            document.getElementById('reporte-productos').innerHTML = '<p class="loading">Cargando datos...</p>';

            // Obtener compras en el período
            const comprasSnapshot = await this.db.collection('compras')
                .where('fecha', '>=', inicio)
                .where('fecha', '<=', fin)
                .get();

            if (comprasSnapshot.empty) {
                document.getElementById('reporte-ventas').innerHTML = '<p class="no-data">No hay compras en este período</p>';
                document.getElementById('reporte-productos').innerHTML = '<p class="no-data">No hay datos de productos vendidos</p>';
                return;
            }

            // Procesar datos de ventas
            let totalVentas = 0;
            let totalCompras = 0;
            const productosVendidos = {};

            const compras = [];
            comprasSnapshot.forEach(doc => {
                const data = doc.data();
                compras.push({
                    id: doc.id,
                    ...data,
                    fecha: data.fecha?.toDate ? data.fecha.toDate() : data.fecha
                });

                // Sumar totales
                totalVentas += data.total || 0;
                totalCompras++;

                // Contar productos vendidos
                if (data.productos && Array.isArray(data.productos)) {
                    data.productos.forEach(producto => {
                        const nombre = producto.nombre || 'Sin nombre';
                        productosVendidos[nombre] = (productosVendidos[nombre] || 0) + (producto.cantidad || 1);
                    });
                }
            });

            // Renderizar reporte de ventas
            this.renderizarReporteVentas(compras, totalVentas, totalCompras, inicio, fin);

            // Renderizar productos más vendidos
            this.renderizarProductosMasVendidos(productosVendidos);

        } catch (error) {
            console.error('Error generando reporte:', error);
            alert('Error al generar el reporte: ' + error.message);
            document.getElementById('reporte-ventas').innerHTML = '<p class="error">Error al cargar los datos</p>';
            document.getElementById('reporte-productos').innerHTML = '<p class="error">Error al cargar los datos</p>';
        }
    }

    renderizarReporteVentas(compras, totalVentas, totalCompras, inicio, fin) {
        const ventasHTML = `
            <div class="reporte-stats">
                <div class="stat-item">
                    <span class="stat-label">Período:</span>
                    <span class="stat-value">${this.formatearFecha(inicio)} a ${this.formatearFecha(fin)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Total de Ventas:</span>
                    <span class="stat-value">$${totalVentas.toFixed(2)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Número de Compras:</span>
                    <span class="stat-value">${totalCompras}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Promedio por Compra:</span>
                    <span class="stat-value">$${(totalVentas / totalCompras).toFixed(2)}</span>
                </div>
            </div>
            <table class="reporte-table">
                <thead>
                    <tr>
                        <th>Número de Orden</th>
                        <th>Cliente</th>
                        <th>Fecha</th>
                        <th>Total</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    ${compras.map(compra => `
                        <tr>
                            <td>${compra.numeroOrden || compra.id}</td>
                            <td>${compra.cliente || 'N/A'}</td>
                            <td>${this.formatearFecha(compra.fecha)}</td>
                            <td>$${(compra.total || 0).toFixed(2)}</td>
                            <td><span class="badge badge-${compra.estado || 'pendiente'}">${compra.estado || 'Pendiente'}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="reporte-actions">
                <button class="btn btn-success" onclick="descargarCSV('ventas')">
                    <i class="bi bi-download"></i> Descargar CSV
                </button>
                <button class="btn btn-info" onclick="imprimirReporte()">
                    <i class="bi bi-printer"></i> Imprimir
                </button>
            </div>
        `;

        document.getElementById('reporte-ventas').innerHTML = ventasHTML;
        window.comprasActuales = compras; // Guardar para descargar
    }

    renderizarProductosMasVendidos(productosVendidos) {
        // Ordenar por cantidad vendida
        const productosOrdenados = Object.entries(productosVendidos)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10); // Top 10

        if (productosOrdenados.length === 0) {
            document.getElementById('reporte-productos').innerHTML = '<p class="no-data">No hay datos de productos vendidos</p>';
            return;
        }

        const productosHTML = `
            <table class="reporte-table">
                <thead>
                    <tr>
                        <th>Posición</th>
                        <th>Producto</th>
                        <th>Cantidad Vendida</th>
                    </tr>
                </thead>
                <tbody>
                    ${productosOrdenados.map((item, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${item[0]}</td>
                            <td><strong>${item[1]}</strong></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="reporte-actions">
                <button class="btn btn-success" onclick="descargarCSV('productos')">
                    <i class="bi bi-download"></i> Descargar CSV
                </button>
            </div>
        `;

        document.getElementById('reporte-productos').innerHTML = productosHTML;
        window.productosVendidosActuales = productosOrdenados; // Guardar para descargar
    }

    formatearFecha(fecha) {
        if (!fecha) return 'N/A';
        if (typeof fecha === 'string') fecha = new Date(fecha);
        return new Intl.DateTimeFormat('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(fecha);
    }
}

// Instancia global
let reportesManager = null;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    reportesManager = new ReportesManager();
});

// ==================== FUNCIONES GLOBALES ====================

function generarReporte() {
    if (reportesManager) {
        reportesManager.generarReportePorPeriodo();
    } else {
        alert('Cargando sistema de reportes...');
    }
}

function descargarCSV(tipo) {
    try {
        let csvContent = "data:text/csv;charset=utf-8,";
        let filename = `reporte_${tipo}_${new Date().toISOString().split('T')[0]}.csv`;

        if (tipo === 'ventas' && window.comprasActuales) {
            // Encabezados
            csvContent += "Número de Orden,Cliente,Fecha,Total,Estado\n";

            // Datos
            window.comprasActuales.forEach(compra => {
                const fecha = reportesManager.formatearFecha(compra.fecha);
                const total = (compra.total || 0).toFixed(2);
                csvContent += `"${compra.numeroOrden || compra.id}","${compra.cliente || 'N/A'}","${fecha}",${total},"${compra.estado || 'Pendiente'}"\n`;
            });
        } else if (tipo === 'productos' && window.productosVendidosActuales) {
            // Encabezados
            csvContent += "Posición,Producto,Cantidad Vendida\n";

            // Datos
            window.productosVendidosActuales.forEach((item, index) => {
                csvContent += `${index + 1},"${item[0]}",${item[1]}\n`;
            });
        } else {
            alert('No hay datos para descargar');
            return;
        }

        // Descargar
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch (error) {
        console.error('Error descargando CSV:', error);
        alert('Error al descargar el archivo');
    }
}

function imprimirReporte() {
    try {
        const ventasContent = document.getElementById('reporte-ventas').innerHTML;
        const productosContent = document.getElementById('reporte-productos').innerHTML;

        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Reporte de Ventas - Pastelería Mil Sabores</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h2 { color: #d42d6b; border-bottom: 2px solid #ff7ba5; padding-bottom: 10px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                    th { background-color: #ff7ba5; color: white; padding: 8px; text-align: left; }
                    td { border-bottom: 1px solid #ddd; padding: 8px; }
                    tr:nth-child(even) { background-color: #fff5f8; }
                    .reporte-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px; }
                    .stat-item { padding: 10px; background: #ffe4ed; border-left: 4px solid #d42d6b; }
                    .stat-label { font-weight: bold; color: #d42d6b; }
                    .stat-value { font-size: 18px; color: #333; }
                </style>
            </head>
            <body>
                <h1>Reporte de Ventas</h1>
                <p>Generado: ${new Date().toLocaleString('es-ES')}</p>
                
                <h2>Ventas del Período</h2>
                ${ventasContent}
                
                <h2>Productos Más Vendidos</h2>
                ${productosContent}
                
                <p style="margin-top: 20px; text-align: center; color: #999; font-size: 12px;">
                    Pastelería Mil Sabores - Reporte Confidencial
                </p>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    } catch (error) {
        console.error('Error imprimiendo reporte:', error);
        alert('Error al imprimir el reporte');
    }
}
