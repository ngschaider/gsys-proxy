# gsys-proxy

gsys-proxy acts as a reverse proxy and adds capabilities to automatically log the user in.

## ServiceType Overview

|                               | Login | Client Isolation | Prevent Logout |
---                             | ---   | ---              | ---            |
| Proxmox Virtual Environment   | ✅    | ❎               | ❎             |
| Gitea                         | ✅    | ❎               | ✅             |