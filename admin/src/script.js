const R = require("ramda")

const items = [
  {
    name: "alice",
    hobbies: ["Golf", "Hacking"],
    colors: ["red", "green"],
  },
  {
    name: "bob",
    hobbies: ["Tenis", "Football"],
    colors: ["red", "green"],
  },
]

const r = R.unwind("hobbies")

R.flatten(R.map(r, items))
