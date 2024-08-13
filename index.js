const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

console.log("kambing");
client.messages
    .create({
        body: 'Your appointment is coming up on July 21 at 3PM qweq we',
        from: `whatsapp:+${process.env.TWILIO_NUMBER}`,
        to: `01234567889`
    })
    .then(message => console.log(message.sid))
    console.log("ayam");
