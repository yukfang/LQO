
const fs = require('node:fs');
const readline = require('node:readline');
const proxying = require('./http/proxing')
const records = require('./readcsv')

const delay = (ms) => new Promise((res, rej) => {
  setTimeout(res, ms * 1000);
})


async function generate() {
  await delay(5);

  console.log(`record = ${records}`)
  console.table(await records)
}


/** Test Pixel */
// const pixel_code = 'CFISF1RC77U7HEMA19M0'
// const token = '9c443508908e08b0f26c4dc6e23b60ce0cb1543b'

/** Prod Pixel */
const pixel_code = 'CFKFS0JC77U2ISBA8QI0'
const token = 'c3c8010673384de0a781b45443489b52f5395a0a'

async function process() {
  await generate();
  for(let i = 0; i < records.length; i++) {
    console.log(records[i])
    await postback(records[i])
  }
}


async function postback(lqolead){
  var TempRegistration =  {
      pixel_code,
      "event": '',
      "timestamp": "2023-01-01T20:41:27Z",
      "context": {"user": {"lead_id": "11111111"}}
  }

  const method    = 'POST';
  const endpoint  = `https://business-api.tiktok.com/open_api/v1.2/pixel/track/`
  const header    = { "Access-Token": token };

  let param = {};
  // console.log(lqolead)

  if(lqolead.hasOwnProperty('register') && lqolead.register.indexOf('2023')==0) {
      let body = Object.assign({}, TempRegistration);
      body.event = "Registration";
      body.timestamp = lqolead.register.replace(' ', 'T').replace('/','-') + ':00Z';
      body.context.user.lead_id = lqolead.lead_id;
      const raw = await proxying(method, endpoint, header, param, body, true);
      let response = JSON.parse(raw.data)
      console.log(`[${response.message}] Postback LQO : [${body.context.user.lead_id}] Event> ${body.event}`)
  }

  if(lqolead.hasOwnProperty("chuoe") && lqolead.chuoe.indexOf('2023')==0) {
      let body = Object.assign({}, TempRegistration);
      body.event = "ChuoE";
      body.timestamp = lqolead.chuoe.replace(' ', 'T').replace('/','-') + ':00Z';
      body.context.user.lead_id = lqolead.lead_id;
      const raw = await proxying(method, endpoint, header, param, body, true);
      let response = JSON.parse(raw.data)
      console.log(`[${response.message}] Postback LQO : [${body.context.user.lead_id}] Event> ${body.event}`)
  }

  if(lqolead.hasOwnProperty("value")) {
      let body = Object.assign({}, TempRegistration);
      if(lqolead.value.toLowerCase() === 'high') {
          body.event = "HighCredit";
      } else if (lqolead.value.toLowerCase() === 'low') {
          body.event = "LowCredit";
      } else if (lqolead.value.toUpperCase() === 'NEGATIVE') {
          body.event = "ZeroCredit";
      } else {
          body.event = "UnknownCredit"
      }

      if(body.event != "UnknownCredit" ) {
          body.timestamp = lqolead.chuoe.replace(' ', 'T').replace('/','-') + ':00Z'; // Use chuo e time as value time
          body.context.user.lead_id = lqolead.lead_id;
          const raw = await proxying(method, endpoint, header, param, body, true);
          let response = JSON.parse(raw.data)
          console.log(`[${response.message}] Postback LQO : [${body.context.user.lead_id}] Event> ${body.event}`)
      }
  }

  if(lqolead.hasOwnProperty("loanapply") && lqolead.loanapply.indexOf('2023')==0) {
      let body = Object.assign({}, TempRegistration);
      body.event = "LoanApply";
      body.timestamp = lqolead.loanapply.replace(' ', 'T').replace('/','-') + ':00Z';
      body.context.user.lead_id = lqolead.lead_id;
      const raw = await proxying(method, endpoint, header, param, body, true);
      let response = JSON.parse(raw.data)
      console.log(`[${response.message}] Postback LQO : [${body.context.user.lead_id}] Event> ${body.event}`)
  }

  if(lqolead.hasOwnProperty("loanapproval") && lqolead.loanapproval.indexOf('2023')==0) {
      let body = Object.assign({}, TempRegistration);
      body.event = "LoanApproval";
      body.timestamp = lqolead.loanapproval.replace(' ', 'T').replace('/','-') + ':00Z';
      body.context.user.lead_id = lqolead.lead_id;
      const raw = await proxying(method, endpoint, header, param, body, true);
      let response = JSON.parse(raw.data)
      console.log(`[${response.message}] Postback LQO : [${body.context.user.lead_id}] Event> ${body.event}`)
  }
}

async function run() {
  let lqoleads = await build_ppd_events();
  console.log(`Total ${lqoleads.length} Leads to post back! `)

  for(let i = 0; i < lqoleads.length; i++) {
      lqo = lqoleads[i];
      await postback(lqo)
  }
}

process();