import dns from 'native-dns'
import { exec } from 'child_process'

const { createServer, Request } = dns
const authority = { address: '8.8.8.8', port: 53, type: 'udp' }
const hosts = {}

let server = createServer()

function command (cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, (err, stdout, stderr) => stdout ? resolve(stdout) : reject(stderr ?? err))
    })
}

async function getDockerHostnames(){
    let containersText = await command('docker ps --format "{{.ID}}"')
    let containers = containersText.split('\n')
    containers.pop()
    await containers.map(async containerID => {
        let json = JSON.parse(await new Promise(resolve => exec(`docker inspect ${containerID}`, (error, stdout) => resolve(stdout))))
        let aliases = json[0].NetworkSettings?.Networks?.development?.Aliases || []
        aliases.map(domain => hosts[domain] = {
            domain,
            records: [
                { type: 'A', address: '127.0.0.1', ttl: 100 }
            ]
        })
    })
}

await getDockerHostnames()
setInterval(getDockerHostnames, 8000)

function proxy(question, response, cb) {
    var request = Request({
        question: question, // forwarding the question
        server: authority,  // this is the DNS server we are asking
        timeout: 1000
    })

    // when we get answers, append them to the response
    request.on('message', (err, msg) => {
        msg.answer.map(a => response.answer.push(a))
    });

    request.on('end', cb)
    request.send()
}

server.on('close', () => console.log('server closed', server.address()))
server.on('error', (err, buff, req, res) => console.error(err.stack))
server.on('socketError', (err, socket) => console.error(err))
server.on('request', async function handleRequest(request, response) {
    try {
        await Promise.all(request.question.map(question => {
            let entry = Object.values(hosts).find(r => new RegExp(r.domain, 'i').test(question.name))
            if (entry) {
                entry.records.map(record => {
                    record.name = question.name;
                    record.ttl = record.ttl ?? 600;
                    return response.answer.push(dns[record.type](record));
                })
            } else {
                return new Promise(resolve => proxy(question, response, resolve))
            }
        }))
    
        response.send()
    } catch (error) {
        console.log(error)
    }
});

server.serve(53, '127.0.0.1');
