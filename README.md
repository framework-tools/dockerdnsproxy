# dockerdnsproxy
Run docker containers on port 80 through a proxy with docker aliases

## Requirements

1. Add 127.0.0.1 to your DNS

**MacOS**:

```sh
networksetup -setdnsservers Wi-Fi 127.0.0.1 8.8.8.8
```
`8.8.8.8` is Google's Public DNS Server

2. Install nodemon globally
3. Install docker
4. Run `npm i`

**Windows**
As administrator:

```sh
netsh interface show config
```
Locate the network connection for which you want the DNS server changed (eg: `WiFi`).

```sh
netsh interface ipv4 add dns "WiFi" 127.0.0.1 index=1
netsh interface ipv4 add dns "WiFi" 8.8.8.8 index=2
ipconfig /flushdns
```


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