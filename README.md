# Interface API Ledger

## Pré-requis

### Initialisation du Ledger

- Avoir un Ledger initialisé et fonctionnel…
- Avoir installé l'application Ethereum et Bitcoin sur le Ledger

### Configuration du Ledger Manager

Le mode "Browser Support" (accessible via les options de l'application Ethereum Ledger) doit être désactivé.

## Installation

`npm install`

## Génération des adresses

### Ethereum

`npm run eth-wallet -- --op=gen-addr --nb=10`

### Bitcoin

`npm run btc-wallet -- --op=gen-addr --nb=10`

## Signature d'une transaction

### Ethereum

`npm run eth-wallet -- --op=sign-tx --addr-path="44'/60'/0'/0/0" --tx-params='{"gasLimit":"0x5208","to":"0x1B8d14D5F3f0Ad4e347F4662EE3741E29D7DbAA6","value":"0x0dc599702e770000","data":"","chainId":1}'`

### Bitcoin

```
export TXHEX=<RAWTX>
export TXINDEX=<TXOUT_INDEX>
export KEYPATH="44'/0'/0'/0/0"
npm run btc-wallet -- --op=sign-tx --key-path=$KEYPATH --output-addr=1CwCXjfDh2enMRoY3fcPHPjyMc1bZ4cTfs --output-amount=100000 --tx-index=$TXINDEX --tx-hex=$TXHEX
```

### Références

https://ledgerhq.github.io/ledgerjs/docs/

