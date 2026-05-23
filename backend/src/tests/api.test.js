

import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import authRouter from '../routes/auth.js';
import coursesRouter from '../routes/courses.js';
import progressRouter from '../routes/progress.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Progress from '../models/Progress.js';

let mongod;
let app;


beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);
    app.use('/api/courses', coursesRouter);
    app.use('/api/progress', progressRouter);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
});

afterEach(async () => {
    await User.deleteMany({});
    await Course.deleteMany({});
    await Progress.deleteMany({});
});


async function registerAndLogin(role = 'student') {
    const email = `${role}_${Date.now()}@test.com`;
    const password = 'testpass123';
    await request(app).post('/api/auth/register').send({ name: 'Test User', email, password, role });
    const res = await request(app).post('/api/auth/login').send({ email, password });
    return { token: res.body.token, userId: res.body.user._id, email, password };
}


describe('Auth — /api/auth', () => {
    test('POST /register crée un compte student', async () => {
        const res = await request(app).post('/api/auth/register').send({
            name: 'Alice', email: 'alice@test.com', password: 'pass1234', role: 'student',
        });
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user.role).toBe('student');
    });

    test('POST /login avec credentials valides retourne un token', async () => {
        await request(app).post('/api/auth/register').send({
            name: 'Bob', email: 'bob@test.com', password: 'pass1234',
        });
        const res = await request(app).post('/api/auth/login').send({
            email: 'bob@test.com', password: 'pass1234',
        });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
    });

    test('POST /login avec mauvais mot de passe retourne 401', async () => {
        await request(app).post('/api/auth/register').send({
            name: 'Charlie', email: 'charlie@test.com', password: 'correctpass',
        });
        const res = await request(app).post('/api/auth/login').send({
            email: 'charlie@test.com', password: 'wrongpass',
        });
        expect(res.status).toBe(401);
    });
});


describe('Courses — /api/courses', () => {
    test('GET / retourne les cours publiés', async () => {
        const { token } = await registerAndLogin('instructor');

        await request(app).post('/api/courses').set('Authorization', `Bearer ${token}`).send({
            title: 'Test Cours', description: 'Description test', category: 'dev', level: 'débutant',
        });
        const res = await request(app).get('/api/courses');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('courses');
    });

    test('POST / crée un cours (instructor)', async () => {
        const { token } = await registerAndLogin('instructor');
        const res = await request(app).post('/api/courses').set('Authorization', `Bearer ${token}`).send({
            title: 'Nouveau cours', description: 'Description', category: 'dev', level: 'débutant',
        });
        expect(res.status).toBe(201);
        expect(res.body.course.title).toBe('Nouveau cours');
    });

    test('POST / sans auth retourne 401', async () => {
        const res = await request(app).post('/api/courses').send({
            title: 'Sans auth',
        });
        expect(res.status).toBe(401);
    });
});


describe('Progress — /api/progress', () => {
    test('GET /me retourne la progression de l\'étudiant', async () => {
        const { token } = await registerAndLogin('student');
        const res = await request(app).get('/api/progress/me').set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('progress');
        expect(Array.isArray(res.body.progress)).toBe(true);
    });
});
