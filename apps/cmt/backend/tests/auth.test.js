import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import jwt from "jsonwebtoken";
import authMiddleware from "../authMiddleware.js";
import makeAuthRouter from "../routes/auth.js";

test("verified session metadata is minimal, private and role-aware", async t => {
    const profiles = new Map();
    const prisma = {professor: {findMany: async () => []}, course: {findFirst: async () => null},
        tBEnrollment: {findFirst: async () => null}, student: {
        findUnique: async ({where}) => profiles.get(where.email),
        upsert: async ({where, create, update}) => {
            const profile = {...(profiles.get(where.email) || {id: "opaque-student-id", ...create}), ...update};
            profiles.set(where.email, profile);
            return profile;
        }
    }};
    const app = express();
    app.use(authMiddleware);
    app.use("/auth", makeAuthRouter(prisma));
    const server = app.listen(0, "127.0.0.1");
    await new Promise(resolve => server.once("listening", resolve));
    const user = {email: "student@rit.edu", givenName: "Student", sn: "Fixture", roles: ["student"], uid: "do-not-return", affiliations: ["do-not-return"]};
    const request = (identity, options) => fetch(`http://127.0.0.1:${server.address().port}/auth/me?email=someone-else@rit.edu&roles=instructor`, {
        headers: identity ? {cookie: `cmt_id=${jwt.sign(identity, process.env.JWT_SECRET || "dev-secret", options)}`} : {}
    });
    try {
        await t.test("missing, expired, invalid and unsupported identities fail closed", async () => {
            for (const identity of [null, {...user, email: undefined}]) {
                const response = await request(identity);
                assert.equal(response.status, 401);
                assert.equal(response.headers.get("cache-control"), "private, no-store");
            }
            assert.equal((await request(user, {expiresIn: -1})).status, 401);
            assert.equal((await request({...user, roles: ["admin"]})).status, 403);
            assert.equal((await request({...user, roles: "student"})).status, 403);
            const response = await fetch(`http://127.0.0.1:${server.address().port}/auth/me`, {headers: {cookie: "cmt_id=not-a-jwt"}});
            assert.equal(response.status, 401);
        });
        await t.test("student metadata comes only from the verified identity", async () => {
            const response = await request({...user, studentProfileId: "do-not-trust"}, {expiresIn: "1h"});
            assert.equal(response.status, 200);
            assert.equal(response.headers.get("cache-control"), "private, no-store");
            const {user: actual} = await response.json();
            assert.deepEqual(Object.keys(actual).sort(), ["email", "expiresInMs", "hasEnrollment", "hasInstructorAccess", "hasTeachingAccess", "name", "roles", "studentProfileId"]);
            assert.equal(actual.hasTeachingAccess, false);
            assert.equal(actual.hasEnrollment, false);
            assert.equal(actual.name, "Student Fixture");
            assert.equal(actual.email, user.email);
            assert.equal(actual.studentProfileId, "opaque-student-id");
            assert.ok(actual.expiresInMs > 3500000 && actual.expiresInMs <= 3600000);
        });
        await t.test("instructor, TA and dual roles preserve only explicit permissions", async () => {
            const instructor = await (await request({...user, roles: ["instructor", "unknown", "instructor"]})).json();
            assert.deepEqual(instructor.user.roles, ["instructor"]);
            assert.equal(instructor.user.studentProfileId, undefined);
            assert.equal((await request({...user, roles: ["ta"]})).status, 200);
            const dual = await (await request({...user, roles: ["student", "professor"]})).json();
            assert.deepEqual(dual.user.roles, ["student", "professor"]);
        });
        await t.test("database failures do not return profile data or internal error details", async () => {
            prisma.student.findUnique = async () => {throw new Error("private-student-information");};
            const response = await request(user);
            assert.equal(response.status, 500);
            assert.deepEqual(await response.json(), {error: "Unable to verify session"});
        });
    } finally {
        await new Promise(resolve => server.close(resolve));
    }
});
