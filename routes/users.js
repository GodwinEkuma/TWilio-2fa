var express = require('express');
var router = express.Router();
require('dotenv').config();
let fs = require("fs").promises;
let path = require('path');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

router.post('/register', async function(req, res, next) {
  const {name, phone, email, password} = req.body

  const data = await fs.readFile(path.join(__dirname, 'users.json'),'utf8')
      .catch((err) => console.log('Failed to read file', err));

  let users = JSON.parse(data.toString());
  users.push({name, phone, email, password});

  await fs.writeFile(path.join(__dirname, 'users.json'), JSON.stringify(users))
      .catch((err) => console.log('Failed to write file', err));
    client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_ID)
      .verifications
      .create({to: phone, channel: 'sms'})
      .then(verification => console.log(verification.status))
      .catch((err) => console.error('Failed send sms', err));
    client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_ID)
        .verifications
        .create({to: email, channel: 'email'})
        .then(verification => console.log(verification.sid));

  res.send('success');
});

router.post('/verify', async function (req, res, next) {
    const {code, phone} = req.body
    const data = await fs.readFile(path.join(__dirname, 'users.json'),'utf8')
      .catch((err) => console.log('Failed to read file', err));

   let users = JSON.parse(data.toString());
   let user = users.find( a => a.phone === phone)
    if(user){
      client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_ID)
          .verificationChecks
          .create({to: phone, code})
          .then(verification_check => console.log(verification_check.status))
          .catch((err) => console.error('Failed to verify', err));
        users = users.map( a => {
          if(a.phone === phone) a.verified = true
          return a
        })
      await fs.writeFile(path.join(__dirname, 'users.json'), JSON.stringify(users))
          .catch((err) => console.log('Failed to write file', err));
      res.send('success');
    }


})

router.post('/signin', async function(req, res, next) {
  const {password, phone} = req.body
  const data = await fs.readFile(path.join(__dirname, 'users.json'),'utf8')
      .catch((err) => console.log('Failed to read file', err));

  let users = JSON.parse(data.toString());
  let user = users.find( a => a.phone === phone)
  if(user && (user.password === password)){
      client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_ID)
          .verifications
          .create({to: phone, channel: 'sms'})
          .then(verification => console.log(verification.status))
          .catch((err) => console.error('Failed send sms', err));

      res.send('success')
  }
});


module.exports = router;
