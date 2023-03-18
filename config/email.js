const sgMail=require("@sendgrid/mail")
const api="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"

sgMail.setApiKey(api)

module.exports.sendEmail=(email,name)=>
{
    sgMail.send(
        {
            to:email,
            from:'js.sathish.2k2@gmail.com',
            subject:"hi",
            text:`hi ${name} Thanks for registering`
        }
    )
}