# SOAP mock (English) — systemd

## Install

```bash
cd /home/admin/CheckSystem_andalus/server

# تأكد أن الملفات موجودة
ls -la server_soap_test_en.js soap-test/

sudo cp deploy/soap-test-en.service /etc/systemd/system/soap-test-en.service
sudo nano /etc/systemd/system/soap-test-en.service   # عدّل User / WorkingDirectory إن لزم

sudo systemctl daemon-reload
sudo systemctl enable --now soap-test-en
sudo systemctl status soap-test-en --no-pager
sudo journalctl -u soap-test-en -n 40 --no-pager
```

## Useful commands

```bash
sudo systemctl restart soap-test-en
sudo systemctl stop soap-test-en
curl -s http://127.0.0.1:8080/health
```

## Point the app to this mock

SOAP Acc: `http://127.0.0.1:8080/FCUBSAccService`  
SOAP IA:  `http://127.0.0.1:8080/FCUBSIAService`

Or from the server folder:
```bash
# if set-soap-endpoint.js points to localhost:8080
node set-soap-endpoint.js
```

**Note:** Do not run `npm run soap:test` and `soap-test-en` together — both use port **8080**.
