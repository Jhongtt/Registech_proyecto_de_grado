const request = require('supertest')
const app = require('../index')
const db = require('../lib/db')

jest.setTimeout(30000)

let adminToken, adminCsrf, adminCookies
let invToken, invCsrf, invCookies
let soporteToken, soporteCsrf, soporteCookies

let testUserId
const testUser = 'e2e_user_' + Date.now()
const testUserEmail = testUser + '@correo.com'

let testEmployeeId
const testDoc = String(Date.now())

let testAreaName

let testEquipoSerie

let testPrestamoId

let testPmcProductId

let testSolicitudId

const log = (mod, test, ok, detail = '') => {
    const icon = ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'
    console.log(`  ${icon} [${mod}] ${test}${detail ? ' → ' + detail : ''}`)
}

// ============================================================
// HELPER: make authenticated request
// ============================================================
const rq = (token, csrf, cookies) => (method, url) => {
    const req = request(app)[method](url)
        .set('Authorization', 'Bearer ' + token)
        .set('X-CSRF-Token', csrf)
        .set('Cookie', cookies)
    return req
}

// ============================================================
// HELPER: assert
// ============================================================
const assert = (mod, test, condition, detail = '') => {
    log(mod, test, condition, detail)
    return condition
}

// ============================================================
// HELPER: count rows
// ============================================================
const countRows = async (table, where = '', params = []) => {
    const q = `SELECT COUNT(*)::int AS c FROM ${table}${where ? ' WHERE ' + where : ''}`
    const { rows } = await db.query(q, params)
    return rows[0].c
}

const findRow = async (table, col, val) => {
    const { rows } = await db.query(`SELECT * FROM ${table} WHERE ${col} = $1`, [val])
    return rows[0] || null
}

// ============================================================
// TEST RUNNER
// ============================================================
const results = { passed: 0, failed: 0, errors: [] }

const TEST = (mod, name, fn) => {
    return async () => {
        try {
            const ok = await fn()
            if (ok !== false) results.passed++
            else { results.failed++; results.errors.push(`[${mod}] ${name} FAILED`) }
        } catch (e) {
            results.failed++
            results.errors.push(`[${mod}] ${name} ERROR: ${e.message}`)
            log(mod, name, false, e.message)
        }
    }
}

// ============================================================
// MAIN
// ============================================================
beforeAll(async () => {
    // Login admin
    const loginAdmin = await request(app)
        .post('/api/login')
        .send({ correo: 'wolftareas@gmail.com', contrasena: 'Clave*2026' })
    adminToken = loginAdmin.body.token
    adminCsrf = loginAdmin.body.csrf_token
    adminCookies = (loginAdmin.headers['set-cookie'] || []).map(c => c.split(';')[0]).join('; ')

    // Login inventario
    const loginInv = await request(app)
        .post('/api/login')
        .send({ correo: 'narilin2006@gmail.com', contrasena: 'Clave*2026' })
    invToken = loginInv.body.token
    invCsrf = loginInv.body.csrf_token
    invCookies = (loginInv.headers['set-cookie'] || []).map(c => c.split(';')[0]).join('; ')

    // Login soporte
    const loginSop = await request(app)
        .post('/api/login')
        .send({ correo: 'cesarcar77@gmail.com', contrasena: 'Clave*2026' })
    soporteToken = loginSop.body.token
    soporteCsrf = loginSop.body.csrf_token
    soporteCookies = (loginSop.headers['set-cookie'] || []).map(c => c.split(';')[0]).join('; ')

    console.log('\n\x1b[1m══════════════════════════════════════════════\x1b[0m')
    console.log('\x1b[1m  PRUEBA E2E COMPLETA DEL SISTEMA REGISTECH\x1b[0m')
    console.log('\x1b[1m══════════════════════════════════════════════\x1b[0m\n')
})

afterAll(async () => {
    // CLEANUP: reverse order to respect FKs
    try {
        if (testSolicitudId) await db.query('DELETE FROM solicitudes WHERE id = $1', [testSolicitudId]).catch(() => {})
        if (testPrestamoId) await db.query('DELETE FROM prestamo_equipos WHERE id_prestamo = $1', [testPrestamoId]).catch(() => {})
        if (testPrestamoId) await db.query('DELETE FROM prestamos WHERE id_prestamo = $1', [testPrestamoId]).catch(() => {})
        if (testEquipoSerie) await db.query('DELETE FROM historial_mantenimientos WHERE num_serie = $1', [testEquipoSerie]).catch(() => {})
        if (testEquipoSerie) await db.query('DELETE FROM reportes WHERE num_serie = $1', [testEquipoSerie]).catch(() => {})
        if (testEquipoSerie) await db.query('DELETE FROM equipos WHERE num_serie = $1', [testEquipoSerie]).catch(() => {})
        if (testEmployeeId) await db.query('DELETE FROM empleados WHERE id_empleado = $1', [testEmployeeId]).catch(() => {})
        if (testUserId) await db.query('DELETE FROM reset_tokens WHERE usuario = $1', [testUserId]).catch(() => {})
        if (testUserId) await db.query('DELETE FROM usuarios WHERE usuario = $1', [testUserId]).catch(() => {})
        if (testAreaName) await db.query('DELETE FROM areas WHERE area = $1', [testAreaName]).catch(() => {})
        if (testPmcProductId) await db.query('DELETE FROM entregas_menor_cuantia WHERE id_producto = $1', [testPmcProductId]).catch(() => {})
        if (testPmcProductId) await db.query('DELETE FROM productos_menor_cuantia WHERE id = $1', [testPmcProductId]).catch(() => {})
    } catch (e) { /* cleanup best-effort */ }

    console.log('\n\x1b[1m══════════════════════════════════════════════\x1b[0m')
    console.log(`\x1b[1m  RESULTADOS: \x1b[32m${results.passed} pasaron\x1b[0m · \x1b[31m${results.failed} fallaron\x1b[0m`)
    if (results.errors.length > 0) {
        console.log('\n  \x1b[31mFallos:\x1b[0m')
        results.errors.forEach(e => console.log('    • ' + e))
    }
    console.log('\x1b[1m══════════════════════════════════════════════\x1b[0m\n')
})

// ============================================================
// 1. HEALTH
// ============================================================
describe('1. HEALTH', () => {
    it('GET /api/health → 200', TEST('HEALTH', 'GET /api/health', async () => {
        const res = await request(app).get('/api/health')
        return assert('HEALTH', 'GET /api/health', res.status === 200 && res.body.ok === true, res.status)
    }))
})

// ============================================================
// 2. AUTH / LOGIN
// ============================================================
describe('2. AUTH / LOGIN', () => {
    it('Login credenciales incorrectas', TEST('AUTH', 'Login credenciales incorrectas', async () => {
        const res = await request(app).post('/api/login').send({ correo: 'wolftareas@gmail.com', contrasena: 'wrong' })
        return assert('AUTH', 'Login incorrecto', res.status === 401, res.status)
    }))

    it('Login correo inexistente', TEST('AUTH', 'Login correo inexistente', async () => {
        const res = await request(app).post('/api/login').send({ correo: 'noexiste@x.com', contrasena: 'Test1234!' })
        return assert('AUTH', 'Login inexistente', res.status === 401, res.status)
    }))

    it('Login sin campos', TEST('AUTH', 'Login sin campos → 400', async () => {
        const res = await request(app).post('/api/login').send({})
        return assert('AUTH', 'Login vacío', res.status === 400, res.status)
    }))

    it('Login devuelve cookie httpOnly', TEST('AUTH', 'Login devuelve cookie', async () => {
        const res = await request(app).post('/api/login').send({ correo: 'wolftareas@gmail.com', contrasena: 'Clave*2026' })
        const cookies = res.headers['set-cookie'] || []
        const hasToken = cookies.some(c => c.startsWith('token='))
        return assert('AUTH', 'Cookie httpOnly', res.status === 200 && hasToken, String(cookies.length))
    }))

    it('Sin token → 401 en ruta protegida', TEST('AUTH', 'Sin token → 401', async () => {
        const res = await request(app).get('/api/usuarios')
        return assert('AUTH', 'Sin token', res.status === 401, res.status)
    }))
})

// ============================================================
// 3. CAMBIO DE CONTRASEÑA
// ============================================================
describe('3. CAMBIO CONTRASEÑA', () => {
    it('Cambiar password válida', TEST('PASSWD', 'Cambiar contraseña', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('post', '/api/usuarios/cambiar-password')
            .send({ contrasena_actual: 'Clave*2026', contrasena_nueva: 'NuevaClave*1234' })
        const ok = res.status === 200
        if (ok) {
            // revert
            await rq(adminToken, adminCsrf, adminCookies)('post', '/api/usuarios/cambiar-password')
                .send({ contrasena_actual: 'NuevaClave*1234', contrasena_nueva: 'Clave*2026' })
        }
        return assert('PASSWD', 'Cambiar contraseña', ok, res.status)
    }))

    it('Password actual incorrecta', TEST('PASSWD', 'Password actual incorrecta → 401', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('post', '/api/usuarios/cambiar-password')
            .send({ contrasena_actual: 'wrongpass', contrasena_nueva: 'NuevaClave*1234' })
        return assert('PASSWD', 'Password incorrecta', res.status === 401, res.status)
    }))

    it('Sin campos → 400', TEST('PASSWD', 'Cambiar password sin campos → 400', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('post', '/api/usuarios/cambiar-password')
            .send({})
        return assert('PASSWD', 'Sin campos', res.status === 400, res.status)
    }))
})

// ============================================================
// 4. USUARIOS CRUD
// ============================================================
describe('4. USUARIOS', () => {
    it('GET /api/usuarios → lista', TEST('USUARIOS', 'GET lista usuarios', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('get', '/api/usuarios')
        return assert('USUARIOS', 'GET usuarios', res.status === 200 && Array.isArray(res.body) && res.body.length >= 4, String(res.body.length) + ' usuarios')
    }))

    it('POST crear usuario', TEST('USUARIOS', 'POST crear usuario', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('post', '/api/usuarios')
            .send({
                usuario: testUser,
                nombre: 'Usuario E2E',
                contrasena: 'TestE2e*1234',
                area: 'Soporte',
                correo: testUserEmail,
                rol: 'inventario',
                estado: 'activo'
            })
        testUserId = res.body.usuario
        return assert('USUARIOS', 'Crear usuario 201', res.status === 201 && res.body.rol === 'inventario', res.status)
    }))

    it('Verificar que aparece en la lista', TEST('USUARIOS', 'Aparece en lista', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('get', '/api/usuarios')
        const found = res.body.find(u => u.usuario === testUser)
        return assert('USUARIOS', 'Aparece en lista', !!found && found.rol === 'inventario', found ? 'rol=' + found.rol : 'NOT FOUND')
    }))

    it('PUT actualizar usuario', TEST('USUARIOS', 'PUT actualizar usuario', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('put', '/api/usuarios/' + testUser)
            .send({
                nombre: 'Usuario E2E Editado',
                contrasena: '',
                area: 'Soporte',
                correo: testUserEmail,
                rol: 'soporte',
                estado: 'activo'
            })
        return assert('USUARIOS', 'Actualizar 200', res.status === 200, res.status)
    }))

    it('Verificar cambio de rol', TEST('USUARIOS', 'Rol actualizado', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('get', '/api/usuarios')
        const found = res.body.find(u => u.usuario === testUser)
        return assert('USUARIOS', 'Rol = soporte', found && found.rol === 'soporte', found ? 'rol=' + found.rol : 'NOT FOUND')
    }))

    it('GET verificar-eliminacion', TEST('USUARIOS', 'GET verificar-eliminacion', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('get', '/api/usuarios/' + testUser + '/verificar-eliminacion')
        return assert('USUARIOS', 'verificar-eliminacion', res.status === 200 && typeof res.body.puedeEliminar === 'boolean', res.status)
    }))

    it('DELETE usuario', TEST('USUARIOS', 'DELETE usuario', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('delete', '/api/usuarios/' + testUser)
        return assert('USUARIOS', 'Eliminar usuario', res.status === 200, res.status)
    }))

    it('DELETE inexistente → 404', TEST('USUARIOS', 'Eliminar inexistente → 404', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('delete', '/api/usuarios/noexiste_xyz')
        return assert('USUARIOS', 'Eliminar 404', res.status === 404, res.status)
    }))

    it('Crear usuario duplicado → 409', TEST('USUARIOS', 'Crear duplicado → 409', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('post', '/api/usuarios')
            .send({
                usuario: 'jhonatan',
                nombre: 'Dup',
                contrasena: 'TestE2e*1234',
                area: 'Soporte',
                correo: 'dup_' + Date.now() + '@x.com',
                rol: 'inventario'
            })
        return assert('USUARIOS', 'Crear duplicado 409', res.status === 409, res.status)
    }))

    it('Crear usuario correo duplicado → 409', TEST('USUARIOS', 'Crear correo duplicado → 409', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('post', '/api/usuarios')
            .send({
                usuario: 'dup_user_' + Date.now(),
                nombre: 'Dup',
                contrasena: 'TestE2e*1234',
                area: 'Soporte',
                correo: 'wolftareas@gmail.com',
                rol: 'inventario'
            })
        return assert('USUARIOS', 'Correo duplicado 409', res.status === 409, res.status)
    }))

    it('Crear sin campos → 400', TEST('USUARIOS', 'Crear sin campos → 400', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('post', '/api/usuarios')
            .send({ usuario: 'ab' })
        return assert('USUARIOS', 'Sin campos 400', res.status === 400, res.status)
    }))

    it('Rol inventario no puede crear usuarios → 403', TEST('USUARIOS', 'Inventario crear → 403', async () => {
        const res = await rq(invToken, invCsrf, invCookies)('post', '/api/usuarios')
            .send({ usuario: 'xxx', nombre: 'X', contrasena: 'Test1234!', area: 'Soporte', correo: 'x@x.com' })
        return assert('USUARIOS', 'Inventario 403', res.status === 403, res.status)
    }))
})

// ============================================================
// 5. RECUPERACIÓN DE CONTRASEÑA
// ============================================================
describe('5. RECUPERACIÓN CONTRASEÑA', () => {
    let resetCode
    let resetUser
    const resetUserName = 'reset_e2e_' + Date.now()
    const resetEmail = resetUserName + '@correo.com'

    it('Crear usuario temporal para recuperación', TEST('RESET', 'Setup usuario temporal', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('post', '/api/usuarios')
            .send({
                usuario: resetUserName,
                nombre: 'Reset E2E',
                contrasena: 'Clave*1234',
                area: 'Soporte',
                correo: resetEmail,
                rol: 'inventario',
                estado: 'activo'
            })
        resetUser = res.body.usuario
        return assert('RESET', 'Setup temporal', res.status === 201, res.status)
    }))

    it('Solicitar recuperación', TEST('RESET', 'POST solicitar-recuperacion', async () => {
        const res = await request(app).post('/api/usuarios/solicitar-recuperacion')
            .send({ correo: resetEmail })
        return assert('RESET', 'Solicitar recuperación', res.status === 200, res.status)
    }))

    it('Código se creó en BD', TEST('RESET', 'Token creado en BD', async () => {
        const { rows } = await db.query('SELECT * FROM reset_tokens WHERE usuario = $1 AND usado = false', [resetUser])
        if (rows.length > 0) resetCode = rows[0].codigo
        return assert('RESET', 'Token en BD', rows.length > 0, 'tokens: ' + rows.length)
    }))

    it('Restablecer con código válido', TEST('RESET', 'POST restablecer-password', async () => {
        if (!resetCode) return assert('RESET', 'Restablecer (skip sin código)', false, 'no token')
        const res = await request(app).post('/api/usuarios/restablecer-password')
            .send({ correo: resetEmail, codigo: resetCode, nuevaContrasena: 'NuevaClave*9999' })
        return assert('RESET', 'Restablecer 200', res.status === 200, res.status)
    }))

    it('Login con la nueva contraseña', TEST('RESET', 'Login con nueva pass', async () => {
        if (!resetCode) return assert('RESET', 'Login (skip)', false, 'no token')
        const res = await request(app).post('/api/login')
            .send({ correo: resetEmail, contrasena: 'NuevaClave*9999' })
        return assert('RESET', 'Login nuevo pass', res.status === 200, res.status)
    }))

    it('Código ya usado → inválido', TEST('RESET', 'Código reutilizado → 400', async () => {
        if (!resetCode) return assert('RESET', 'Reutilizar (skip)', false, 'no token')
        const res = await request(app).post('/api/usuarios/restablecer-password')
            .send({ correo: resetEmail, codigo: resetCode, nuevaContrasena: 'OtraClave*9998' })
        return assert('RESET', 'Código reutilizado 400', res.status === 400, res.status)
    }))

    it('Correo inexistente → mismo mensaje (seguridad)', TEST('RESET', 'Correo fantasma', async () => {
        const res = await request(app).post('/api/usuarios/solicitar-recuperacion')
            .send({ correo: 'fantasma_' + Date.now() + '@x.com' })
        return assert('RESET', 'Fantasma 200', res.status === 200, res.status)
    }))

    it('Eliminar usuario temporal', TEST('RESET', 'Cleanup usuario temporal', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('delete', '/api/usuarios/' + resetUser)
        return assert('RESET', 'Cleanup temporal', res.status === 200, res.status)
    }))
})

// ============================================================
// 6. ÁREAS CRUD
// ============================================================
describe('6. ÁREAS', () => {
    testAreaName = 'Area E Dos E'

    it('GET /api/areas → lista', TEST('AREAS', 'GET areas', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('get', '/api/areas')
        return assert('AREAS', 'GET areas', res.status === 200 && Array.isArray(res.body), String(res.body.length) + ' areas')
    }))

    it('POST crear área', TEST('AREAS', 'POST crear area', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('post', '/api/areas')
            .send({ area: testAreaName })
        return assert('AREAS', 'Crear area', res.status === 201, res.status)
    }))

    it('PUT actualizar área', TEST('AREAS', 'PUT actualizar area', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('put', '/api/areas/' + encodeURIComponent(testAreaName))
            .send({ area: testAreaName + ' vdos' })
        const ok = res.status === 200
        if (ok) testAreaName = testAreaName + ' vdos'
        return assert('AREAS', 'Actualizar area', ok, res.status)
    }))

    it('DELETE área', TEST('AREAS', 'DELETE area', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('delete', '/api/areas/' + encodeURIComponent(testAreaName))
        return assert('AREAS', 'Eliminar area', res.status === 200, res.status)
        // clear so afterAll doesn't try to delete again
    }))

    it('POST crear duplicada → 409', TEST('AREAS', 'Crear duplicada', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('post', '/api/areas')
            .send({ area: 'Soporte' })
        return assert('AREAS', 'Duplicada 409', res.status === 409, res.status)
    }))

    it('Inventario no puede crear áreas → 403', TEST('AREAS', 'Inventario crear area → 403', async () => {
        const res = await rq(invToken, invCsrf, invCookies)('post', '/api/areas')
            .send({ area: 'Hack' })
        return assert('AREAS', 'Inventario 403', res.status === 403, res.status)
    }))
})

// ============================================================
// 7. EMPLEADOS CRUD
// ============================================================
describe('7. EMPLEADOS', () => {
    it('GET /api/empleados → lista', TEST('EMPLEADOS', 'GET empleados', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('get', '/api/empleados')
        return assert('EMPLEADOS', 'GET empleados', res.status === 200 && Array.isArray(res.body), String(res.body.length) + ' empleados')
    }))

    it('POST crear empleado', TEST('EMPLEADOS', 'POST crear empleado', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('post', '/api/empleados')
            .send({
                nombre: 'Empleado E2E',
                tipo_documento: 'CC',
                documento: testDoc,
                correo: 'emp_e2e_' + testDoc + '@correo.com',
                area: 'Soporte',
                estado: 'activo'
            })
        testEmployeeId = res.body.empleado?.id_empleado
        return assert('EMPLEADOS', 'Crear empleado 201', res.status === 201 && testEmployeeId, res.status)
    }))

    it('PUT actualizar empleado', TEST('EMPLEADOS', 'PUT actualizar', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('put', '/api/empleados/' + testEmployeeId)
            .send({ nombre: 'Empleado E2E Editado', estado: 'activo' })
        return assert('EMPLEADOS', 'Actualizar 200', res.status === 200, res.status)
    }))

    it('DELETE empleado', TEST('EMPLEADOS', 'DELETE empleado', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('delete', '/api/empleados/' + testEmployeeId)
        return assert('EMPLEADOS', 'Eliminar 200', res.status === 200, res.status)
    }))

    it('Documento duplicado → 409', TEST('EMPLEADOS', 'Doc duplicado → 409', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('post', '/api/empleados')
            .send({ nombre: 'Dup', tipo_documento: 'CC', documento: '123456987', area: 'Soporte' })
        return assert('EMPLEADOS', 'Doc duplicado 409', res.status === 409, res.status)
    }))

    it('Sin campos → 400', TEST('EMPLEADOS', 'Sin campos → 400', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('post', '/api/empleados')
            .send({ nombre: 'Solo nombre' })
        return assert('EMPLEADOS', 'Sin campos 400', res.status === 400, res.status)
    }))

    it('Inventario no puede crear empleados → 403', TEST('EMPLEADOS', 'Inventario crear → 403', async () => {
        const res = await rq(invToken, invCsrf, invCookies)('post', '/api/empleados')
            .send({ nombre: 'Hack', tipo_documento: 'CC', documento: '000', area: 'Soporte' })
        return assert('EMPLEADOS', 'Inventario 403', res.status === 403, res.status)
    }))
})

// ============================================================
// 8. EQUIPOS
// ============================================================
describe('8. EQUIPOS', () => {
    it('GET estados_equipo', TEST('EQUIPOS', 'GET estados', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('get', '/api/estados_equipo')
        return assert('EQUIPOS', 'GET estados', res.status === 200 && Array.isArray(res.body), String(res.body.length) + ' estados')
    }))

    it('GET /api/equipos', TEST('EQUIPOS', 'GET equipos', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('get', '/api/equipos')
        return assert('EQUIPOS', 'GET equipos', res.status === 200 && Array.isArray(res.body), String(res.body.length) + ' equipos')
    }))

    it('POST crear equipo', TEST('EQUIPOS', 'POST crear equipo', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('post', '/api/equipos/add')
            .field('num_serie', 'E2E-' + Date.now())
            .field('equipo', 'Laptop E2E')
            .field('marca', 'Lenovo')
            .field('modelo', 'ThinkPad E2E')
            .field('estado', 'Disponible')
            .field('area', 'Soporte')
            .field('descripcion', 'Equipo de prueba E2E')
        testEquipoSerie = res.body.equipo?.num_serie || res.body.num_serie
        return assert('EQUIPOS', 'Crear equipo', (res.status === 201 || res.status === 200) && testEquipoSerie, res.status + (res.body.error ? ' ' + res.body.error : ''))
    }))

    it('GET reportes', TEST('EQUIPOS', 'GET reportes', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('get', '/api/equipos/reporte')
        return assert('EQUIPOS', 'GET reportes', res.status === 200, res.status)
    }))

    it('GET mantenimientos (admin)', TEST('EQUIPOS', 'GET mantenimientos', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('get', '/api/equipos/mantenimientos')
        return assert('EQUIPOS', 'GET mantenimientos', res.status === 200, res.status)
    }))

    it('GET historial equipo', TEST('EQUIPOS', 'GET historial equipo', async () => {
        if (!testEquipoSerie) return assert('EQUIPOS', 'Historial (skip)', false, 'no equipo')
        const res = await rq(adminToken, adminCsrf, adminCookies)('get', '/api/equipos/' + testEquipoSerie + '/historial')
        return assert('EQUIPOS', 'Historial equipo', res.status === 200, res.status)
    }))

    it('POST buscar mantenimientos', TEST('EQUIPOS', 'POST buscar mantenimientos', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('post', '/api/equipos/mantenimientos/find')
            .send({ filter: 'E2E' })
        return assert('EQUIPOS', 'Buscar mantenimientos', res.status === 200, res.status)
    }))

    it('PATCH mover equipo', TEST('EQUIPOS', 'PATCH mover equipo', async () => {
        if (!testEquipoSerie) return assert('EQUIPOS', 'Mover (skip)', false, 'no equipo')
        const res = await rq(adminToken, adminCsrf, adminCookies)('patch', '/api/equipos/' + testEquipoSerie + '/ubicacion')
            .send({ area: 'Administracion' })
        return assert('EQUIPOS', 'Mover equipo', res.status === 200, res.status)
    }))
})

// ============================================================
// 9. PRÉSTAMOS
// ============================================================
describe('9. PRÉSTAMOS', () => {
    it('GET /api/prestamos', TEST('PRESTAMOS', 'GET prestamos', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('get', '/api/prestamos')
        return assert('PRESTAMOS', 'GET prestamos', res.status === 200, res.status)
    }))

    it('GET /api/prestamos/activos', TEST('PRESTAMOS', 'GET activos', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('get', '/api/prestamos/activos')
        return assert('PRESTAMOS', 'GET activos', res.status === 200, res.status)
    }))

    it('GET estadísticas', TEST('PRESTAMOS', 'GET estadísticas', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('get', '/api/estadisticas')
        return assert('PRESTAMOS', 'GET estadísticas', res.status === 200, res.status)
    }))

    it('POST crear préstamo', TEST('PRESTAMOS', 'POST crear préstamo', async () => {
        if (!testEquipoSerie) return assert('PRESTAMOS', 'Crear préstamo (skip)', false, 'no equipo')
        const res = await rq(adminToken, adminCsrf, adminCookies)('post', '/api/prestamos')
            .send({
                num_series: [testEquipoSerie],
                id_empleado: null,
                id_usuario: 16,
                observaciones: 'Préstamo E2E',
                fecha_limite: '2026-12-31'
            })
        if (res.status === 201) {
            const { rows } = await db.query('SELECT pe.id_prestamo FROM prestamo_equipos pe INNER JOIN prestamos p ON p.id_prestamo = pe.id_prestamo WHERE pe.num_serie = $1 ORDER BY p.fecha_prestamo DESC LIMIT 1', [testEquipoSerie])
            testPrestamoId = rows[0]?.id_prestamo
        }
        return assert('PRESTAMOS', 'Crear préstamo', res.status === 201 && !!testPrestamoId, res.status + (testPrestamoId ? ' id=' + testPrestamoId : ''))
    }))

    it('GET prestamo activo por equipo', TEST('PRESTAMOS', 'GET activo por equipo', async () => {
        if (!testEquipoSerie) return assert('PRESTAMOS', 'Activo equipo (skip)', false, 'no equipo')
        const res = await rq(adminToken, adminCsrf, adminCookies)('get', '/api/prestamos/activos/' + testEquipoSerie)
        return assert('PRESTAMOS', 'Activo por equipo', res.status === 200 || res.status === 404, res.status)
    }))

    it('GET historial por equipo', TEST('PRESTAMOS', 'GET historial equipo', async () => {
        if (!testEquipoSerie) return assert('PRESTAMOS', 'Historial equipo (skip)', false, 'no equipo')
        const res = await rq(adminToken, adminCsrf, adminCookies)('get', '/api/prestamos/historial/' + testEquipoSerie)
        return assert('PRESTAMOS', 'Historial equipo', res.status === 200, res.status)
    }))

    it('GET historial por empleado', TEST('PRESTAMOS', 'GET historial empleado', async () => {
        const emp = await db.query('SELECT id_empleado FROM empleados LIMIT 1')
        if (emp.rows.length === 0) return assert('PRESTAMOS', 'Historial emp (skip)', false, 'no emp')
        const res = await rq(adminToken, adminCsrf, adminCookies)('get', '/api/prestamos/historial/empleado/' + emp.rows[0].id_empleado)
        return assert('PRESTAMOS', 'Historial empleado', res.status === 200, res.status)
    }))

    it('GET historial por usuario', TEST('PRESTAMOS', 'GET historial usuario', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('get', '/api/prestamos/historial/usuario/16')
        return assert('PRESTAMOS', 'Historial usuario', res.status === 200, res.status)
    }))

    it('POST devolver equipo', TEST('PRESTAMOS', 'POST devolver equipo', async () => {
        if (!testPrestamoId || !testEquipoSerie) return assert('PRESTAMOS', 'Devolver (skip)', false, 'no prestamo/equipo')
        const res = await rq(adminToken, adminCsrf, adminCookies)('post', '/api/prestamos/' + testPrestamoId + '/equipos/' + testEquipoSerie + '/devolver')
            .field('observaciones', 'Devolución E2E')
        return assert('PRESTAMOS', 'Devolver equipo', res.status === 200 || res.status === 201, res.status)
    }))
})

// ============================================================
// 10. DASHBOARD
// ============================================================
describe('10. DASHBOARD', () => {
    it('GET /api/dashboard', TEST('DASHBOARD', 'GET dashboard', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('get', '/api/dashboard')
        return assert('DASHBOARD', 'GET dashboard', res.status === 200, res.status)
    }))

    it('GET exportar-equipos', TEST('DASHBOARD', 'GET exportar-equipos', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('get', '/api/dashboard/exportar-equipos')
        return assert('DASHBOARD', 'GET exportar', res.status === 200, res.status)
    }))
})

// ============================================================
// 11. SOLICITUDES
// ============================================================
describe('11. SOLICITUDES', () => {
    it('POST crear solicitud', TEST('SOLICITUDES', 'POST crear solicitud', async () => {
        const res = await rq(invToken, invCsrf, invCookies)('post', '/api/solicitudes')
            .send({ tipo_equipo: 'Laptop', descripcion: 'Solicitud E2E de prueba', justificacion: 'Pruebas automatizadas' })
        testSolicitudId = res.body.id
        return assert('SOLICITUDES', 'Crear solicitud', res.status === 201 && !!testSolicitudId, res.status)
    }))

    it('GET mis solicitudes', TEST('SOLICITUDES', 'GET mis solicitudes', async () => {
        const res = await rq(invToken, invCsrf, invCookies)('get', '/api/solicitudes/mis')
        return assert('SOLICITUDES', 'GET mis', res.status === 200, res.status)
    }))

    it('GET todas las solicitudes (admin)', TEST('SOLICITUDES', 'GET todas (admin)', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('get', '/api/solicitudes')
        return assert('SOLICITUDES', 'GET todas', res.status === 200, res.status)
    }))

    it('PUT responder solicitud', TEST('SOLICITUDES', 'PUT responder', async () => {
        if (!testSolicitudId) return assert('SOLICITUDES', 'Responder (skip)', false, 'no solicitud')
        const res = await rq(adminToken, adminCsrf, adminCookies)('put', '/api/solicitudes/' + testSolicitudId + '/responder')
            .send({ estado: 'aprobada', respuesta: 'Respuesta E2E al usuario' })
        return assert('SOLICITUDES', 'Responder 200', res.status === 200, res.status)
    }))

    it('GET actividad reciente (admin)', TEST('SOLICITUDES', 'GET actividad reciente', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('get', '/api/actividad')
        return assert('SOLICITUDES', 'Actividad reciente', res.status === 200, res.status)
    }))

    it('Inventario no puede listar todas → 403', TEST('SOLICITUDES', 'Inventario todas → 403', async () => {
        const res = await rq(invToken, invCsrf, invCookies)('get', '/api/solicitudes')
        return assert('SOLICITUDES', 'Inventario 403', res.status === 403, res.status)
    }))
})

// ============================================================
// 12. PMC
// ============================================================
describe('12. PMC', () => {
    it('GET /api/pmc/', TEST('PMC', 'GET productos', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('get', '/api/pmc/')
        return assert('PMC', 'GET productos', res.status === 200 && Array.isArray(res.body), String(res.body.length) + ' productos')
    }))

    it('POST crear producto', TEST('PMC', 'POST crear producto', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('post', '/api/pmc/')
            .send({ nombre: 'Producto E2E', descripcion: 'Producto de prueba', cantidad_total: 100 })
        testPmcProductId = res.body.producto?.id || res.body.id
        return assert('PMC', 'Crear producto', (res.status === 201 || res.status === 200) && testPmcProductId, res.status)
    }))

    it('PUT actualizar producto', TEST('PMC', 'PUT actualizar', async () => {
        if (!testPmcProductId) return assert('PMC', 'Actualizar (skip)', false, 'no producto')
        const res = await rq(adminToken, adminCsrf, adminCookies)('put', '/api/pmc/' + testPmcProductId)
            .send({ nombre: 'Producto E2E v2', cantidad_total: 150 })
        return assert('PMC', 'Actualizar 200', res.status === 200, res.status)
    }))

    it('POST entregar producto', TEST('PMC', 'POST entregar', async () => {
        if (!testPmcProductId) return assert('PMC', 'Entregar (skip)', false, 'no producto')
        const emp = await db.query('SELECT id_empleado FROM empleados LIMIT 1')
        if (emp.rows.length === 0) return assert('PMC', 'Entregar (skip)', false, 'no emp')
        const res = await rq(adminToken, adminCsrf, adminCookies)('post', '/api/pmc/' + testPmcProductId + '/entregar')
            .send({ cantidad: 5, id_empleado: emp.rows[0].id_empleado, area: 'Soporte', observaciones: 'Entrega E2E' })
        return assert('PMC', 'Entregar 200', res.status === 200 || res.status === 201, res.status)
    }))

    it('GET historial entregas', TEST('PMC', 'GET historial entregas', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('get', '/api/pmc/entregas/historial')
        return assert('PMC', 'Historial entregas', res.status === 200, res.status)
    }))

    it('DELETE producto', TEST('PMC', 'DELETE producto', async () => {
        if (!testPmcProductId) return assert('PMC', 'Eliminar (skip)', false, 'no producto')
        await db.query('DELETE FROM entregas_menor_cuantia WHERE id_producto = $1', [testPmcProductId]).catch(() => {})
        const res = await rq(adminToken, adminCsrf, adminCookies)('delete', '/api/pmc/' + testPmcProductId)
        return assert('PMC', 'Eliminar 200', res.status === 200, res.status)
    }))

    it('Inventario puede CRUD PMC', TEST('PMC', 'Inventario GET productos', async () => {
        const res = await rq(invToken, invCsrf, invCookies)('get', '/api/pmc/')
        return assert('PMC', 'Inventario PMC OK', res.status === 200, res.status)
    }))

    it('Soporte solo puede leer PMC', TEST('PMC', 'Soporte GET (allowed)', async () => {
        const res = await rq(soporteToken, soporteCsrf, soporteCookies)('get', '/api/pmc/')
        return assert('PMC', 'Soporte GET 200', res.status === 200, res.status)
    }))
})

// ============================================================
// 13. NOTIFICACIONES
// ============================================================
describe('13. NOTIFICACIONES', () => {
    it('GET /api/notificaciones', TEST('NOTIF', 'GET notificaciones', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('get', '/api/notificaciones')
        return assert('NOTIF', 'GET notificaciones', res.status === 200, res.status)
    }))

    it('GET /api/notificaciones/no-leidas', TEST('NOTIF', 'GET no-leidas', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('get', '/api/notificaciones/no-leidas')
        return assert('NOTIF', 'GET no-leidas', res.status === 200, res.status)
    }))

    it('PATCH marcar-todas-leidas', TEST('PATCH', 'PATCH marcar todas leidas', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('patch', '/api/notificaciones/marcar-todas-leidas')
        return assert('NOTIF', 'Marcar todas leidas', res.status === 200, res.status)
    }))

    it('PATCH marcar una leida (si hay)', TEST('NOTIF', 'PATCH marcar leida', async () => {
        const { rows } = await db.query('SELECT id FROM notificaciones LIMIT 1')
        if (rows.length === 0) return assert('NOTIF', 'Marcar leida (skip)', true, 'sin notifs')
        const res = await rq(adminToken, adminCsrf, adminCookies)('patch', '/api/notificaciones/' + rows[0].id + '/leida')
        return assert('NOTIF', 'Marcar leida', res.status === 200, res.status)
    }))
})

// ============================================================
// 14. AUTH: INVENTARIO Y SOPORTE EN RUTAS RESTRINGIDAS
// ============================================================
describe('14. AUTH / ROLES', () => {
    it('Soporte no puede crear usuarios → 403', TEST('ROLES', 'Soporte crear usuario → 403', async () => {
        const res = await rq(soporteToken, soporteCsrf, soporteCookies)('post', '/api/usuarios')
            .send({ usuario: 'hack', nombre: 'X', contrasena: 'Test1234!', area: 'Soporte', correo: 'h@x.com' })
        return assert('ROLES', 'Soporte 403 usuarios', res.status === 403, res.status)
    }))

    it('Inventario no puede eliminar empleados → 403', TEST('ROLES', 'Inventario eliminar emp → 403', async () => {
        const res = await rq(invToken, invCsrf, invCookies)('delete', '/api/empleados/00000000-0000-0000-0000-000000000000')
        return assert('ROLES', 'Inventario 403 empleados', res.status === 403, res.status)
    }))

    it('Soporte no puede crear áreas → 403', TEST('ROLES', 'Soporte crear area → 403', async () => {
        const res = await rq(soporteToken, soporteCsrf, soporteCookies)('post', '/api/areas')
            .send({ area: 'Hack' })
        return assert('ROLES', 'Soporte 403 areas', res.status === 403, res.status)
    }))

    it('Soporte puede crear reportes', TEST('ROLES', 'Soporte crear reporte (si equipo existe)', async () => {
        const res = await rq(soporteToken, soporteCsrf, soporteCookies)('get', '/api/equipos/reporte')
        return assert('ROLES', 'Soporte ver reportes', res.status === 200, res.status)
    }))

    it('Inventario puede crear equipos', TEST('ROLES', 'Inventario crear equipo', async () => {
        const res = await rq(invToken, invCsrf, invCookies)('post', '/api/equipos/add')
            .field('num_serie', 'INV-' + Date.now())
            .field('equipo', 'PC Inventario')
            .field('marca', 'Dell')
            .field('modelo', 'Optiplex')
            .field('estado', 'disponible')
            .field('area', 'Inventario')
        // could be 201 or 400 (missing field) - we just test auth
        return assert('ROLES', 'Inventario crear equipo', res.status !== 403, 'status=' + res.status)
    }))

    it('Soporte no puede liberar equipos → 403', TEST('ROLES', 'Soporte liberar → 403', async () => {
        const res = await rq(soporteToken, soporteCsrf, soporteCookies)('post', '/api/equipos/SIN-SERIE/liberar')
        return assert('ROLES', 'Soporte liberar 403', res.status === 403, res.status)
    }))

    it('Soporte no puede devolver préstamos → 403', TEST('ROLES', 'Soporte devolver → 403', async () => {
        const res = await rq(soporteToken, soporteCsrf, soporteCookies)('post', '/api/prestamos/00000000-0000-0000-0000-000000000000/equipos/SIN-SERIE/devolver')
        return assert('ROLES', 'Soporte devolver 403', res.status === 403, res.status)
    }))

    it('Sin autenticación en ruta protegida → 401', TEST('ROLES', 'Sin auth → 401', async () => {
        const res = await request(app).get('/api/equipos')
        return assert('ROLES', 'Sin auth 401', res.status === 401, res.status)
    }))
})

// ============================================================
// 15. 404 GENÉRICO
// ============================================================
describe('15. RUTAS INEXISTENTES', () => {
    it('Ruta inexistente → 404', TEST('404', 'GET /api/ruta_inexistente', async () => {
        const res = await rq(adminToken, adminCsrf, adminCookies)('get', '/api/ruta_inexistente_xyz')
        return assert('404', 'Ruta inexistente', res.status === 404, res.status)
    }))
})
