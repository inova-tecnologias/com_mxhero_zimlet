# mxgateway zimlet

Zimbra users can enhance their emails activating MX Gateway featrues through this zimlet.

## Features

- [x] Attachment Track
- [x] Private Delivery
- [x] Secure Email
- [x] Enhanced Bcc
- [x] Self Destruct
- [x] Reply Timeout

## Install

On each mailstore you should run the following commands as `root` user:
```sh
git clone https://github.com/inova-tecnologias/com_mxhero_zimlet.git
chown -Rf zimbra: com_mxhero_zimlet/
chmod -Rf 640 com_mxhero_zimlet/
mv com_mxhero_zimlet /opt/zimbra/zimlets-deployed/
```

You can restart the mailbox service as `zimbra` user.
```sh
zmmailboxdctl restart
```
