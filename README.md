# dockerdnsproxy
Run docker containers on port 80 through a proxy with docker aliases

## Requirements

1. Add 127.0.0.1 to your DNS

```sh
networksetup -setdnsservers Wi-Fi 127.0.0.1 8.8.8.8
```
`8.8.8.8` is Google's Public DNS Server

2. Install nodemon, docker & docker-compose


## Starting proxy + dns server
```sh
nodemon
```
and in a seperate shell
```sh
docker-compose up
```

### Todo

- [ ] Setup automatic DNS update
  - [ ] Windows
  - [ ] MacOS
- [ ] Slim code
- [ ] Start docker automatically from node
- [ ] Attach each docker to network automatically
- [ ] Create docker-compose instructions