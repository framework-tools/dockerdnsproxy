import dns from 'native-dns'
import { exec } from 'child_process'

let server = dns.createServer()
let authority = { address: '8.8.8.8', port: 53, type: 'udp' }

let hosts = {}

async function getDockerHostnames(){
    let containersText = await new Promise(resolve => exec('docker ps -a --format "table {{.ID}}"', (error, stdout) => resolve(stdout)))
    let containers = containersText.split('\n')
    containers.shift()
    containers.pop()
    let promises = containers.map(async containerID => {
        let json = JSON.parse(await new Promise(resolve => exec(`docker inspect ${containerID}`, (error, stdout) => resolve(stdout))))
        let hostname = json[0].Config.Hostname
        let aliases = json[0].NetworkSettings?.Networks?.development?.Aliases || []
        aliases.map(alias => hosts[alias] = {
            domain: `^${alias}*`,
            records: [
                { type: 'A', address: '127.0.0.1', ttl: 600 }
            ]
        })
    })
    await Promise.all(promises)
    console.log(hosts)
}

await getDockerHostnames()
setInterval(getDockerHostnames, 8000)

function proxy(question, response, cb) {
    console.log('proxying', question.name)

    var request = dns.Request({
        question: question, // forwarding the question
        server: authority,  // this is the DNS server we are asking
        timeout: 1000
    })

    // when we get answers, append them to the response
    request.on('message', (err, msg) => {
        msg.answer.forEach(a => response.answer.push(a))
    });

    request.on('end', cb)
    request.send()
}

server.on('listening', () => console.log('server listening on', server.address()))
server.on('close', () => console.log('server closed', server.address()))
server.on('error', (err, buff, req, res) => console.error(err.stack))
server.on('socketError', (err, socket) => console.error(err))

server.on('request', async function handleRequest(request, response) {
    let f = []; // array of functions

    request.question.forEach(question => {
        let entry = Object.values(hosts).filter(r => new RegExp(r.domain, 'i').exec(question.name));
        if (entry.length) {
            entry[0].records.forEach(record => {
                record.name = question.name;
                record.ttl = record.ttl || 600;
                response.answer.push(dns[record.type](record));
            })
        } else {
            f.push(new Promise(cb => proxy(question, response, cb)))
        }
    })

    // do the proxying in parallel
    // when done, respond to the request by sending the response
    await Promise.all(f)
    response.send()
});

server.serve(53, '127.0.0.1');
