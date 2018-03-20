import AppEth from "@ledgerhq/hw-app-eth";
import TransportU2F from "@ledgerhq/hw-transport-u2f";
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";

const BASE_PATH = "44'/60'/0'/0/"

let args = require('minimist')(process.argv.slice(2))

let operation = args['op']

switch(operation) {
  case "gen-addr":
    let nb_addresses = args['nb'] || 10
    genAddresses(nb_addresses)
    break
  case "sign-tx":
    let addressPath = args['addr-path']
    let rawTx       = args['raw-tx']
    signTransaction(addressPath, rawTx)
    break
  default:
    printUsage(process.argv);
}

async function genAddresses(nb_addresses) {
  let eth;
  try {
    let transport = await TransportNodeHid.create()
    eth = new AppEth(transport)
  } catch(e) {
    console.log(e)
  }

  // CSV header
  console.log("path, publicKey, address")

  for (let index of Array(nb_addresses).keys()) {
    let path = `${BASE_PATH}${index}`

    await eth.getAddress(path).then(function(result) {
      let publicKey = result.publicKey
      let address   = result.address
      console.log(`${index},"${path}", ${publicKey}, ${address}`);

    }).catch(function(err) {
      console.log(err.name)
      console.log(err.message)
      console.log(err.statusCode)
      console.log(err.statusText)
      console.log('-')
    });
  }
}

async function signTransaction(addressPath, rawTransaction) {
  try {
    console.log("Trying to sign the following TX:")
    console.log(rawTransaction)
    let [s, v, r] = await eth.signTransaction(addressPath, rawTransaction)
    console.log(s)
    console.log(v)
    console.log(r)
  } catch(err) {
    console.log(JSON.stringify(err))
    console.log('-')
  }
}

function printUsage(argv) {
  let program_name = argv[0]
  let command = argv[1]
  console.log(`Usage: ${program_name} ${command} <options>`)
  console.log('')
  console.log("  --op=gen-addr|sign-tx  Operation")
  console.log('')
  console.log('  gen-add parameters:')
  console.log("  --nb=N                 Number of generated addresses")
  console.log('')
  console.log('  sign-tx parameters:')
  console.log("  --addr-path=PATH       (sign-tx)  Path of private key to use")
  console.log("  --raw-tx=RAWTX         (sign-tx)  Raw transaction")
}

