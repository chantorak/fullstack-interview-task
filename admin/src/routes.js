const express = require("express")
const bodyParser = require("body-parser")
const config = require("config")
const request = require("request")
const R = require("ramda")
const app = express()
const {json2csv} = require('json-2-csv');

app.use(bodyParser.json({limit: "10mb"}))

app.get("/investments/:id", (req, res) => {
  const {id} = req.params
  request.get(`${config.investmentsServiceUrl}/investments/${id}`, (e, r, investments) => {
    if (e) {
      console.error(e)
      res.send(500)
    } else {
      res.send(investments)
    }
  })
})

async function httpGET(url) {
  return await (await fetch(url)).json();
}

async function completeHolding(investment) {
  const { holdings } = investment
  const fetchedHolding = await httpGET(`${config.holdingCompaniesServiceUrl}/companies/${holdings.id}`);

  investment.holding = {...holdings, ...fetchedHolding, value: investment.investmentTotal * holdings.investmentPercentage}
  return investment;
}

app.get("/generateReport", async (req, res) => {
  try {
    const fetchedInvestments = await httpGET(`${config.investmentsServiceUrl}/investments`);

    const unwindAndCompleteHoldings = R.pipe(
      R.map(R.unwind("holdings")),
      R.flatten,
      R.map(completeHolding),
      R.bind(Promise.all, Promise),
    )

    const investments = await unwindAndCompleteHoldings(fetchedInvestments)

    const csvResult = json2csv(investments, {
      keys: [
        { field: 'userId', title: 'User' },
        { field: 'firstName', title: 'First Name' },
        { field: 'lastName', title: 'Last Name' },
        { field: 'date', title: 'Date' },
        { field: 'holding.name', title: 'Holding' },
        { field: 'holding.value', title: 'Value' }
      ]
    })

    return res.type("text/csv").send(csvResult)
  } catch (e) {
    console.error(e)
    return res.sendStatus(500)
  }
})

module.exports = app
