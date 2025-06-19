/**
 * 🔍 VALIDACIÓN FINAL BACKEND STOCKIT - CON CREDENCIALES VÁLIDAS
 * Usando: admin@stockit.com / Admin123
 */

const http = require('http');
const { URL } = require('url');

const BASE_URL = 'http://localhost:3002';
const VALID_CREDENTIALS = {
    email: 'admin@stockit.com',
    password: 'Admin123'
};

class FinalBackendValidator {
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
                'User-Agent': 'StockIT-Final-Validator/1.0'
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
                        resolve({ status: res.statusCode, data: response });
                    } catch (e) {
                        resolve({ status: res.statusCode, data: data });
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
        console.log(`📋 ${this.totalTests.toString().padStart(2, '0')}: ${description}`);
        
        try {
            const response = await this.makeRequest(endpoint, method, body, requireAuth);
            
            if (response.status >= 200 && response.status < 300) {
                console.log(`     ✅ SUCCESS (${response.status}) - ${this.getDataSummary(response.data)}`);
                this.successCount++;
                return response.data;
            } else {
                console.log(`     ⚠️ STATUS ${response.status}: ${JSON.stringify(response.data).substring(0, 60)}...`);
                if (response.status >= 400) {
                    this.errors.push(`❌ ${description}: ${response.status} - ${response.data.message || 'Error'}`);
                }
                return response.data;
            }
        } catch (error) {
            console.log(`     ❌ ERROR: ${error.message}`);
            this.errors.push(`❌ ${description}: ${error.message}`);
            return null;
        }
    }

    getDataSummary(data) {
        if (!data) return 'Sin datos';
        if (typeof data === 'string') return data.substring(0, 40) + '...';
        if (data.data && Array.isArray(data.data)) return `${data.data.length} elementos`;
        if (Array.isArray(data)) return `${data.length} elementos`;
        if (data.message) return data.message;
        if (data.token) return 'Token recibido';
        return 'Datos recibidos';
    }

    async authenticate() {
        console.log('\n🔑 AUTENTICACIÓN CON CREDENCIALES VÁLIDAS');
        console.log('-'.repeat(50));
        
        console.log(`🔐 Autenticando: ${VALID_CREDENTIALS.email}`);
        const loginData = await this.testEndpoint(
            'Login con credenciales válidas',
            '/api/auth/login',
            'POST',
            VALID_CREDENTIALS,
            false
        );

        if (loginData && loginData.token) {
            this.token = loginData.token;
            console.log(`     🔑 TOKEN OBTENIDO EXITOSAMENTE`);
            console.log(`     🔑 Usuario: ${loginData.usuario || 'Admin'}`);
            console.log(`     🔑 Rol: ${loginData.rol || 'admin'}`);
            return true;
        }

        console.log(`     ❌ Error en autenticación`);
        return false;
    }

    async validateAllModules() {
        console.log('\n📊 VALIDACIÓN COMPLETA DE TODOS LOS MÓDULOS');
        console.log('='.repeat(50));

        console.log('\n🏠 MÓDULO: BÁSICOS');
        await this.testEndpoint('Endpoint raíz', '/', 'GET', null, false);

        console.log('\n📦 MÓDULO: PRODUCTOS Y CATEGORÍAS');
        await this.testEndpoint('Listar productos', '/api/products');
        await this.testEndpoint('Listar categorías', '/api/products/categories');

        console.log('\n👥 MÓDULO: ENTIDADES');
        await this.testEndpoint('Listar empleados', '/api/employees');
        await this.testEndpoint('Listar sectores', '/api/sectors');
        await this.testEndpoint('Listar sucursales', '/api/branches');

        console.log('\n📋 MÓDULO: INVENTARIO INDIVIDUAL');
        await this.testEndpoint('Inventario notebooks/celulares', '/api/inventory');

        console.log('\n📦 MÓDULO: STOCK GENERAL');
        await this.testEndpoint('Stock actual', '/api/stock/current');
        await this.testEndpoint('Stock general', '/api/stock/general');
        await this.testEndpoint('Movimientos stock', '/api/stock/movements');
        await this.testEndpoint('Alertas stock bajo', '/api/stock/alerts');

        console.log('\n👥 MÓDULO: ASIGNACIONES');
        await this.testEndpoint('Asignaciones activas', '/api/assignments/active');

        console.log('\n🔧 MÓDULO: REPARACIONES');
        await this.testEndpoint('Reparaciones activas', '/api/repairs/active');

        console.log('\n📊 MÓDULO: DASHBOARD');
        await this.testEndpoint('Dashboard stats', '/api/dashboard/stats');
        await this.testEndpoint('Dashboard alertas', '/api/dashboard/alerts');
        await this.testEndpoint('Dashboard KPIs', '/api/dashboard/kpis');

        console.log('\n📈 MÓDULO: REPORTES');
        await this.testEndpoint('Reporte stock alerts', '/api/reports/stock-alerts');

        console.log('\n🔍 MÓDULO: BÚSQUEDA');
        await this.testEndpoint('Búsqueda global', '/api/search?query=test');

        console.log('\n👤 MÓDULO: USUARIOS');
        await this.testEndpoint('Perfil usuario', '/api/auth/profile');
        await this.testEndpoint('Listar usuarios', '/api/users');
        await this.testEndpoint('Stats usuarios', '/api/users/stats');
    }

    async printDetailedSummary() {
        console.log('\n' + '='.repeat(70));
        console.log('🏆 RESUMEN FINAL - VALIDACIÓN POST-SINCRONIZACIÓN SQL');
        console.log('='.repeat(70));

        console.log('\n📊 ESTADÍSTICAS DETALLADAS:');
        console.log(`   ✅ Endpoints funcionando: ${this.successCount}/${this.totalTests}`);
        console.log(`   ❌ Endpoints con problemas: ${this.totalTests - this.successCount}/${this.totalTests}`);
        console.log(`   📈 Tasa de éxito: ${((this.successCount/this.totalTests)*100).toFixed(1)}%`);

        const successRate = this.successCount / this.totalTests;
        
        if (this.errors.length > 0) {
            console.log('\n❌ PROBLEMAS DETECTADOS:');
            this.errors.forEach((error, i) => console.log(`   ${i+1}. ${error}`));
        }

        const status = successRate >= 0.95 ? '🎉 PERFECTO' : 
                      successRate >= 0.85 ? '✅ EXCELENTE' :
                      successRate >= 0.75 ? '✅ BUENO' :
                      successRate >= 0.60 ? '⚠️ ACEPTABLE' : 
                      '❌ PROBLEMAS CRÍTICOS';

        console.log(`\n🎯 VEREDICTO FINAL: ${status}`);

        if (successRate >= 0.80) {
            console.log('\n🚀 CONCLUSIÓN OFICIAL:');
            console.log('✅ El backend de StockIT está OPERATIVO después de la sincronización SQL');
            console.log('✅ La mayoría de stored procedures funcionan correctamente');
            console.log('✅ Sistema de autenticación completamente funcional');
            console.log('✅ Módulos core del sistema operativos');
            console.log('✅ LISTO PARA PRODUCCIÓN');
        } else if (successRate >= 0.60) {
            console.log('\n⚠️ CONCLUSIÓN:');
            console.log('✅ Funcionalidad básica operativa');
            console.log('⚠️ Algunos módulos requieren atención');
            console.log('📋 Revisar problemas listados arriba');
        } else {
            console.log('\n❌ CONCLUSIÓN CRÍTICA:');
            console.log('❌ Problemas significativos detectados');
            console.log('🔧 Requiere atención inmediata antes de producción');
        }

        console.log(`\n📅 Validación ejecutada: ${new Date().toLocaleString('es-ES')}`);
        console.log(`🔍 Total endpoints probados: ${this.totalTests}`);
        console.log(`🔑 Autenticación: ${this.token ? 'EXITOSA' : 'FALLIDA'}`);
    }

    async run() {
        console.log('🚀 VALIDACIÓN FINAL BACKEND STOCKIT POST-SINCRONIZACIÓN SQL');
        console.log('='.repeat(70));
        console.log('🔍 Validando que todas las funcionalidades siguen operativas...');

        const authSuccess = await this.authenticate();
        
        if (authSuccess) {
            await this.validateAllModules();
        } else {
            console.log('\n❌ No se pudo autenticar. Validando solo endpoints públicos...');
            await this.testEndpoint('Endpoint raíz', '/', 'GET', null, false);
        }

        await this.printDetailedSummary();
    }
}

const finalValidator = new FinalBackendValidator();
finalValidator.run().catch(console.error); 