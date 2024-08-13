const accountSid = 'AC39f596e11de7412757a1005122b27fd3';
const authToken = '0174e01095199637b57b146b3f838cf1';
const client = require('twilio')(accountSid, authToken);

console.log("kambing");
client.messages
    .create({
        body: 'Your appointment is coming up on July 21 at 3PM qweq we',
        from: 'whatsapp:+14155238886',
        to: 'whatsapp:+60175845874'
    })
    .then(message => console.log(message.sid))
    console.log("ayam");
