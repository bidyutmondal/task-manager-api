const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name)=>{
    sgMail.send({
        to: email,
        from: 'bidyutmondal427@gmail.com',
        subject: 'Welcome to our task app',
        text: `Hi ${name}, we are glad to see you as a our first user. Let us know if you face any porblem.`
    })
}

const sendCancellationEmail = (email, name)=>{
    sgMail.send({
        to: email,
        from: 'bidyutmondal427@gmail.com',
        subject: 'Happy journey ahead.',
        text: `Hi ${name}, we are sorry to see you leave. Best of luck for your journey ahead. You can always come back to us whenever you feel the need to do so.`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancellationEmail
}