import AppEth from "@ledgerhq/hw-app-eth";
import TransportU2F from "@ledgerhq/hw-transport-u2f";
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";
//import EthereumTx from 'ethereumjs-tx'
const EthereumTx = require('ethereumjs-tx')

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
    let txParams    = args['tx-params']
    signTransaction(addressPath, txParams)
    break
  default:
    printUsage(process.argv);
}

async function getClient() {
  let eth;
  try {
    let transport = await TransportNodeHid.create()
    return new AppEth(transport)
  } catch(e) {
    console.log(e)
  }
}

async function genAddresses(nb_addresses) {
  let eth = await getClient()

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

function generateRawTransaction(txParams) {
  /*
  const txParams = {
    nonce: '0x01',
    gasPrice: '0x04e3b29200', 
    gasLimit: '0x5208',
    to: '0x1B8d14D5F3f0Ad4e347F4662EE3741E29D7DbAA6',
    value: '0x0dc599702e770000', 
    data: '',
    // EIP 155 (chainId): mainnet: 1, ropsten: 3
    chainId: 1
  }
  */

  if(!txParams['to'])
    throw 'Missing parameter "to" in transaction params'

  let tx = new EthereumTx(txParams)
  console.log(JSON.stringify(tx))
  return tx.serialize()
}

async function signTransaction(addressPath, txParamsStr) {
  try {
    let eth = await getClient()

    console.log("Trying to sign the following TX:")
    console.log(txParamsStr)

    let txParams = JSON.parse(txParamsStr)
    console.log("Parsed TX params:")
    console.log(txParams)

    let rawTransaction = generateRawTransaction(txParams)
    console.log("Raw Transaction:")
    console.log(rawTransaction)

    let {v, r, s} = await eth.signTransaction(addressPath, rawTransaction)
    let signedTransaction = v + r + s

    console.log('--- Signed TX ---')
    console.log(signedTransaction)
    console.log('-----------------')
  } catch(err) {
    console.log('------------------------------')
    console.log('--- TRANSACTION NOT SIGNED ---')
    console.log('------------------------------')
    console.log(err)
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
  console.log("  --tx-params=TXPARAMS   (sign-tx)  TX params")
}

