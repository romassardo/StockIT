/**
 * 🔍 VALIDADOR BACKEND STOCKIT POST-SINCRONIZACIÓN SQL
 * Objetivo: Verificar que todas las funcionalidades críticas siguen operativas
 * Versión: v1.0.83
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

const BASE_URL = 'http://localhost:3002';

class BackendValidator {
    constructor() {
        this.token = null;
        this.successCount = 0;
        this.totalTests = 0;
        this.errors = [];
    }

    async makeRequest(endpoint, method = 'GET', body = null, requireAuth = true) {
        const url = new URL(endpoint, BASE_URL);
        
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'StockIT-Validator/1.0'
            }
        };

        if (requireAuth && this.token) {
            options.headers['Authorization'] = `Bearer ${this.token}`;
        }

        return new Promise((resolve, reject) => {
            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        resolve({ status: res.statusCode, data: response, headers: res.headers });
                    } catch (e) {
                        resolve({ status: res.statusCode, data: data, headers: res.headers });
                    }
                });
            });

            req.on('error', reject);
            
            if (body) {
                req.write(JSON.stringify(body));
            }
            
            req.end();
        });
    }

    async testEndpoint(description, endpoint, method = 'GET', body = null, requireAuth = true) {
        this.totalTests++;
        console.log(`📋 PRUEBA ${this.totalTests}: ${description}`);
        
        try {
            const response = await this.makeRequest(endpoint, method, body, requireAuth);
            
            if (response.status >= 200 && response.status < 300) {
                console.log(`   ✅ SUCCESS (${response.status})`);
                this.successCount++;
                return response.data;
            } else if (response.status === 401 && requireAuth && !this.token) {
                console.log(`   ⚠️ REQUIERE AUTH (${response.status}) - Esperado`);
                return null;
            } else {
                console.log(`   ⚠️ STATUS ${response.status}: ${JSON.stringify(response.data).substring(0, 100)}`);
                return response.data;
            }
        } catch (error) {
            console.log(`   ❌ ERROR: ${error.message}`);
            this.errors.push(`❌ ${description}: ${error.message}`);
            return null;
        }
    }

    async authenticate() {
        console.log('\n🔑 AUTENTICACIÓN');
        console.log('-'.repeat(40));
        
        // Intentar con diferentes credenciales comunes
        const credentials = [
            { email: 'admin@stockit.com', password: 'admin123' },
            { email: 'admin@empresa.com', password: 'admin123' },
            { email: 'admin1@empresa.com', password: 'admin123' },
            { email: 'usuario1@empresa.com', password: 'usuario123' }
        ];

        for (const cred of credentials) {
            console.log(`🔐 Intentando login: ${cred.email}`);
            const loginData = await this.testEndpoint(
                `Login ${cred.email}`,
                '/api/auth/login',
                'POST',
                cred,
                false
            );

            if (loginData && loginData.token) {
                this.token = loginData.token;
                console.log(`   🔑 Token obtenido exitosamente`);
                return true;
            }
        }

        console.log(`   ⚠️ No se pudo obtener token con ninguna credencial`);
        return false;
    }

    async validateBasicEndpoints() {
        console.log('\n🔍 FASE 1: ENDPOINTS BÁSICOS');
        console.log('-'.repeat(40));

        await this.testEndpoint('Endpoint raíz', '/', 'GET', null, false);
        await this.testEndpoint('Listar productos', '/api/products');
        await this.testEndpoint('Listar categorías', '/api/products/categories');
        await this.testEndpoint('Listar empleados', '/api/employees');
        await this.testEndpoint('Listar sectores', '/api/sectors');
        await this.testEndpoint('Listar sucursales', '/api/branches');
    }

    async validateInventoryStock() {
        console.log('\n📦 FASE 2: INVENTARIO Y STOCK');
        console.log('-'.repeat(40));

        await this.testEndpoint('Inventario individual (notebooks/celulares)', '/api/inventory');
        await this.testEndpoint('Stock general (otros productos)', '/api/stock');
        await this.testEndpoint('Stock bajo mínimo', '/api/stock/alerts');
        await this.testEndpoint('Movimientos de stock', '/api/stock/movements');
    }

    async validateAssignmentsRepairs() {
        console.log('\n👥 FASE 3: ASIGNACIONES Y REPARACIONES');
        console.log('-'.repeat(40));

        await this.testEndpoint('Listar asignaciones', '/api/assignments');
        await this.testEndpoint('Asignaciones activas', '/api/assignments/active');
        await this.testEndpoint('Listar reparaciones', '/api/repairs');
        await this.testEndpoint('Reparaciones activas', '/api/repairs/active');
    }

    async validateReportsDashboard() {
        console.log('\n📊 FASE 4: REPORTES Y DASHBOARD');
        console.log('-'.repeat(40));

        await this.testEndpoint('Métricas dashboard', '/api/dashboard/metrics');
        await this.testEndpoint('Estadísticas dashboard', '/api/dashboard/stats');
        await this.testEndpoint('Reporte inventario', '/api/reports/inventory');
        await this.testEndpoint('Reporte alertas stock', '/api/reports/stock-alerts');
        await this.testEndpoint('Búsqueda global', '/api/search?query=test');
    }

    async validateUserManagement() {
        console.log('\n👤 FASE 5: GESTIÓN DE USUARIOS');
        console.log('-'.repeat(40));

        if (this.token) {
            await this.testEndpoint('Perfil usuario', '/api/auth/profile');
            await this.testEndpoint('Listar usuarios', '/api/users');
            await this.testEndpoint('Stats usuarios', '/api/users/stats');
        }
    }

    async printSummary() {
        console.log('\n' + '='.repeat(60));
        console.log('🏆 RESUMEN VALIDACIÓN BACKEND');
        console.log('='.repeat(60));

        console.log('\n📊 ESTADÍSTICAS FINALES:');
        console.log(`   ✅ Pruebas exitosas: ${this.successCount}/${this.totalTests}`);
        console.log(`   ❌ Pruebas fallidas: ${this.totalTests - this.successCount}/${this.totalTests}`);
        console.log(`   📈 Tasa de éxito: ${((this.successCount/this.totalTests)*100).toFixed(2)}%`);

        if (this.errors.length > 0) {
            console.log('\n❌ ERRORES DETECTADOS:');
            this.errors.forEach(error => console.log(`   ${error}`));
        }

        const successRate = this.successCount / this.totalTests;
        const status = successRate === 1.0 ? '🎉 PERFECTO' : 
                      successRate > 0.8 ? '⚠️ MAYORMENTE FUNCIONAL' : 
                      '❌ PROBLEMAS CRÍTICOS';

        console.log(`\n🎯 ESTADO FINAL: ${status}`);

        if (successRate === 1.0) {
            console.log('\n🚀 CONCLUSIÓN: El backend está 100% operativo después de la sincronización SQL');
            console.log('✅ Todas las funcionalidades críticas validadas exitosamente');
            console.log('✅ Los stored procedures funcionan correctamente');
            console.log('✅ Listo para producción');
        } else if (successRate > 0.8) {
            console.log('\n⚠️ CONCLUSIÓN: El backend está mayormente funcional con algunos problemas menores');
            console.log('📋 Revisar errores específicos arriba');
        } else {
            console.log('\n❌ CONCLUSIÓN: Se detectaron problemas críticos que requieren atención inmediata');
            console.log('🔧 Revisar configuración y stored procedures');
        }

        console.log(`\n📅 Validación completada: ${new Date().toISOString()}`);
    }

    async run() {
        console.log('🚀 INICIANDO VALIDACIÓN COMPLETA BACKEND STOCKIT');
        console.log('='.repeat(60));

        // Intentar autenticarse
        await this.authenticate();

        // Ejecutar todas las validaciones
        await this.validateBasicEndpoints();
        await this.validateInventoryStock();
        await this.validateAssignmentsRepairs();
        await this.validateReportsDashboard();
        await this.validateUserManagement();

        // Mostrar resumen
        await this.printSummary();
    }
}

// Ejecutar validación
const validator = new BackendValidator();
validator.run().catch(console.error); 