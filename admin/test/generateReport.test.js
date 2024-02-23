const supertest = require("supertest")
const app = require("../src/routes.js")
const fs = require("fs").promises

const superApp = supertest(app)

describe("/generateReport endpoint", () => {
  test("should return the response", async () => {
    const expected = await fs.readFile(__dirname + "/expected.csv", "utf-8")

    return superApp
      .get("/generateReport")
      .expect("Content-Type", "text/csv; charset=utf-8")
      .expect(200)
      .then((response) => {
        expect(response.text).toContain(expected)
      })
  })
})

describe("/exportReport endpoint", () => {
  test("should post the report to investment api", async () => {
    const expected = await fs.readFile(__dirname + "/expected.csv", "utf-8")

    return superApp
      .post("/exportReport")
      .send(JSON.stringify({CSV: expected}))
      .set('Accept', 'application/json')
      .expect(200);
  })
})

