# SolidityFlask1example
SolidityFlask1example

## BlockchainUnSoloNodo.py
esempio con un solo blocco, only a server, not centralized

### TO run
```
$ py blockchain.py 5000
```

Per usare
```
$ curl http://localhost:5000/blockchain
```

Per minare
```
$ curl http://localhost:5000/mine
```

Per eseguire una trasazione in post
```
#   $ curl -X POST -H "Content-Type: application/json" -d '{"sender": "04d0988bfa799f7d7ef9ab3de97ef481", "recipient":"cd0f75d2367ad456607647edde665d6f", "amount": 5}' "http://localhost:5000/transactions/new"
```

