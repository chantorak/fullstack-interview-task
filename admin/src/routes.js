const express = require("express")
const bodyParser = require("body-parser")
const config = require("config")
const R = require("ramda")
const app = express()
const {json2csv} = require("json-2-csv")

app.use(bodyParser.json({limit: "10mb"}))

async function httpGET(url) {
  return await (await fetch(url)).json()
}

app.get("/investments/:id", async (req, res) => {
  try {
    const {id} = req.params
    const investment = await httpGET(
      `${config.investmentsServiceUrl}/investments/${id}`,
    )
    res.send(investment)
  } catch (e) {
    console.error(e)
    res.send(500)
  }
})

async function completeHolding(investment) {
  const {holdings} = investment
  const fetchedHolding = await httpGET(
    `${config.holdingCompaniesServiceUrl}/companies/${holdings.id}`,
  )

  investment.holding = {
    ...holdings,
    ...fetchedHolding,
    value: investment.investmentTotal * holdings.investmentPercentage,
  }
  return investment
}

app.get("/generateReport", async (req, res) => {
  try {
    const fetchedInvestments = await httpGET(
      `${config.investmentsServiceUrl}/investments`,
    )

    const unwindAndCompleteHoldings = R.pipe(
      R.map(R.unwind("holdings")),
      R.flatten,
      R.map(completeHolding),
      R.bind(Promise.all, Promise),
    )

    const investments = await unwindAndCompleteHoldings(fetchedInvestments)

    const csvResult = json2csv(investments, {
      keys: [
        {field: "userId", title: "User"},
        {field: "firstName", title: "First Name"},
        {field: "lastName", title: "Last Name"},
        {field: "date", title: "Date"},
        {field: "holding.name", title: "Holding"},
        {field: "holding.value", title: "Value"},
      ],
    })

    return res.type("text/csv").send(csvResult)
  } catch (e) {
    console.error(e)
    return res.sendStatus(500)
  }
})

app.post("/exportReport", async (req, res) => {
  try {
    const {body} = req

    const csv = body.csv

    await fetch(`${config.investmentsServiceUrl}/investments/export`, {
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({csv}),
      method: "POST",
    })

    return res.status(200).send()
  } catch (e) {
    console.error(e)
    return res.sendStatus(500)
  }
})

module.exports = app
