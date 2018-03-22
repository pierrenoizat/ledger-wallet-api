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

`npm run gen-eth -- --op=gen-addr --nb=10`

## Signature d'une transaction

`npm run gen-eth -- --op=sign-tx --addr-path="44'/60'/0'/0/0" --tx-params='{"nonce":"0x01","gasPrice":"0x04e3b29200","gasLimit":"0x5208","to":"0x1B8d14D5F3f0Ad4e347F4662EE3741E29D7DbAA6","value":"0x0dc599702e770000","data":"","chainId":1}'`

### Références

https://ledgerhq.github.io/ledgerjs/docs/

