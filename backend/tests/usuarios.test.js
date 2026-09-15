const request = require('supertest')
const app = require('../index')

let adminToken
let csrfToken
let cookies

beforeAll(async () => {
    const res = await request(app)
        .post('/api/login')
        .send({ correo: 'wolftareas@gmail.com', contrasena: 'Clave*2026' })
    adminToken = res.body.token
    csrfToken = res.body.csrf_token

    const setCookies = res.headers['set-cookie']
    if (setCookies) {
        cookies = setCookies.map(c => c.split(';')[0]).join('; ')
    }
})

describe('GET /api/usuarios', () => {
    it('debería rechazar sin token', async () => {
        const res = await request(app).get('/api/usuarios')
        expect(res.status).toBe(401)
    })

    it('debería retornar lista de usuarios con token válido', async () => {
        const res = await request(app)
            .get('/api/usuarios')
            .set('Authorization', `Bearer ${adminToken}`)
        expect(res.status).toBe(200)
        expect(Array.isArray(res.body)).toBe(true)
        expect(res.body.length).toBeGreaterThan(0)
    })

    it('usuarios no deberían incluir campo contrasena', async () => {
        const res = await request(app)
            .get('/api/usuarios')
            .set('Authorization', `Bearer ${adminToken}`)
        expect(res.status).toBe(200)
        res.body.forEach(u => {
            expect(u.contrasena).toBeUndefined()
        })
    })
})

describe('GET /api/areas', () => {
    it('debería retornar lista de áreas con token', async () => {
        const res = await request(app)
            .get('/api/areas')
            .set('Authorization', `Bearer ${adminToken}`)
        expect(res.status).toBe(200)
        expect(Array.isArray(res.body)).toBe(true)
        expect(res.body.length).toBeGreaterThan(0)
    })
})

describe('POST /api/usuarios (crear)', () => {
    it('debería crear o detectar usuario existente', async () => {
        const usuario = `testuser_${Date.now()}`
        const res = await request(app)
            .post('/api/usuarios')
            .set('Authorization', `Bearer ${adminToken}`)
            .set('X-CSRF-Token', csrfToken)
            .set('Cookie', cookies)
            .send({
                usuario,
                contrasena: 'Test1234!',
                nombre: 'Usuario de Prueba',
                area: 'Tecnologia',
                correo: `${usuario}@correo.com`,
                estado: 'activo'
            })
        expect(res.status).toBe(201)

        const db = require('../lib/db')
        await db.query('DELETE FROM reset_tokens WHERE usuario = $1', [usuario])
        await db.query('DELETE FROM usuarios WHERE usuario = $1', [usuario])
    })

    it('debería rechazar si faltan campos obligatorios', async () => {
        const res = await request(app)
            .post('/api/usuarios')
            .set('Authorization', `Bearer ${adminToken}`)
            .set('X-CSRF-Token', csrfToken)
            .set('Cookie', cookies)
            .send({ usuario: 'test' })
        expect(res.status).toBe(400)
    })

    it('debería retornar 409 si el correo ya está registrado', async () => {
        const res = await request(app)
            .post('/api/usuarios')
            .set('Authorization', `Bearer ${adminToken}`)
            .set('X-CSRF-Token', csrfToken)
            .set('Cookie', cookies)
            .send({
                usuario: 'test_correo_dup',
                contrasena: 'Test1234!',
                nombre: 'Correo Duplicado',
                area: 'Tecnologia',
                correo: 'wolftareas@gmail.com',
                estado: 'activo'
            })
        expect(res.status).toBe(409)
        expect(res.body.error).toBe('El correo ya está registrado')
    })
})
