import { performance } from "perf_hooks";
import supertest from "supertest";
import { buildApp } from "./app";

const app = supertest(buildApp());

async function basicLatencyTest() {
    await app.post("/reset").expect(204);
    const start = performance.now();
    await app.post("/charge").expect(200);
    await app.post("/charge").expect(200);
    await app.post("/charge").expect(200);
    await app.post("/charge").expect(200);
    await app.post("/charge").expect(200);
    console.log(`Latency: ${performance.now() - start} ms`);
}

async function concurrencyTest() {
    await app.post("/reset")
        .send({account: "test"})
        .expect(204);
    let promises = [];
    for (let i = 0; i < 99; i++) {
        promises.push(app.post("/charge")
            .send({account: "test", charges: 1})
            .expect(200)
            .expect("Content-Type", "application/json; charset=utf-8"));
    }
    await Promise.all(promises).then(() => console.log("Concurrent calls finished"));

    await app.post("/charge")
        .send({account: "test", charges: 1})
        .expect(200)
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect({isAuthorized: true, remainingBalance: 0, charges: 1});
}

async function chargeTestBalanceOk() {
    await app.post("/reset")
        .send({account: "test"})
        .expect(204);
    await app.post("/charge")
        .send({account: "test", charges: 100})
        .expect(200)
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect({ isAuthorized: true, remainingBalance: 0, charges: 100 });
}

async function chargeTestBalanceNotSufficient() {
    await app.post("/reset")
        .send({account: "test"})
        .expect(204);
    await app.post("/charge")
        .send({account: "test", charges: 101})
        .expect(200)
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect({isAuthorized: false, remainingBalance: 100, charges: 0});
}


async function runTests() {
    await basicLatencyTest();
    await chargeTestBalanceOk();
    await chargeTestBalanceNotSufficient();
    await concurrencyTest();
}

runTests().catch(console.error);
