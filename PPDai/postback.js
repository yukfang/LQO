const proxying = require('./http/proxing')
const lead2req = require('./lead_2_req')
const req2gaid = require('./req_2_gaid')
const fs = require('fs');
const readline = require('readline');

/** Test Pixel */
const pixel_code = 'CFISF1RC77U7HEMA19M0'
const token = '9c443508908e08b0f26c4dc6e23b60ce0cb1543b'

/** Prod Pixel */
// const pixel_code = 'CFKFS0JC77U2ISBA8QI0'
// const token = 'c3c8010673384de0a781b45443489b52f5395a0a'


var TempRegistration =  {
    pixel_code,
    "event": "Assessment",
    "timestamp": "2023-01-01T20:41:27Z",
    "context": {"user": {"lead_id": "11111111"}}
}


async function de_dup_lead2req(){
    let lead2req_uniq = [];
    for(let i = 0 ; i < lead2req.length; i++) {
        let rec = lead2req[i];
        let exist = false;
        for(let j = 0; j < lead2req_uniq.length; j++) {
            // console.log(lead2req_uniq[j])
            if(rec.lead.toLowerCase() == lead2req_uniq[j].lead.toLowerCase() && rec.req_id.toLowerCase() == lead2req_uniq[j].req_id.toLowerCase()) {
                exist = true;
                break;
            }
        }
        if(!exist) {
            lead2req_uniq.push(rec);
        }
    }

    console.log(lead2req_uniq.length)
    // console.table(lead2req_uniq)
    let leads = [];
    for(let i = 0; i < lead2req_uniq.length; i++) {
        if(!leads.includes(lead2req_uniq[i].lead)) {
            leads.push(lead2req_uniq[i].lead)
        }
    }
    console.log(`total ${leads.length} uniq leads...`)
    return lead2req_uniq;
}






async function build_gaid_2_events() {
    const fileStream = fs.createReadStream('gaid_2_event.txt');

    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let gaid_2_events = []
    for await (const line of rl) {
      let items = line.split(',');
    //   console.log(items)

      let gaid_2_event = {
        gaid: items[0],
        register: items[1],
        loandisbursal: items[2],
        credit: items[3],
        loanapply: items[4],
        loanapproval: items[5]
      }

      gaid_2_events.push(gaid_2_event);
    }

    // console.table(gaid_2_events);

    return gaid_2_events;
}


async function build_leads() {
    let tiktokevents = await de_dup_lead2req();
    for(let i = 0; i < tiktokevents.length; i++) {
        let req_id = tiktokevents[i].req_id;
        for(let j = 0; j < req2gaid.length; j++) {
            if(req_id == req2gaid[j].req_id) {
                // console.log(`req_id=${req_id}, req2gaid=${req2gaid[j].key}, req2gaid.gaid=${req2gaid[j].value}`)
                tiktokevents[i].gaid = req2gaid[j].gaid;
            }
        }
    }


    // console.table(tiktokevents);
    console.log(tiktokevents[0])

    let ppdaievents = await build_gaid_2_events();
    // console.table(tiktokevents);
    console.log(ppdaievents[0])

    let lqoevents = []
    for(let i = 0; i < ppdaievents.length; i++) {
        let ppdai = ppdaievents[i];
        for(let j = 0; j < tiktokevents.length; j++){
            let tiktok = tiktokevents[j];
            if(tiktok.gaid != null && (tiktok.gaid.toLowerCase() == ppdai.gaid.toLowerCase())) {
                ppdai.lead = tiktok.lead.substring(4, tiktok.lead.length);
                lqoevents.push(ppdai)
                // console.log(`matched`)
                // console.log(ppdai)
                // console.log(tiktok)
                break;
            }
        }
        // console.log(ppdai)
    }

    // console.table(lqoevents);
    return lqoevents;
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
        body.timestamp = lqolead.register.replace(' ', 'T') + ':00Z';
        body.context.user.lead_id = lqolead.lead;
        const raw = await proxying(method, endpoint, header, param, body, true);
        let response = JSON.parse(raw.data)
        // console.log(`[${response.message}] Postback LQO : [${body.context.user.lead_id}] Event> ${body.event}`)
    }

    if(lqolead.hasOwnProperty("loandisbursal") && lqolead.loandisbursal.indexOf('2023')==0) {
        let body = Object.assign({}, TempRegistration);
        body.event = "LoanDisbursal";
        body.timestamp = lqolead.loandisbursal.replace(' ', 'T') + ':00Z';
        body.context.user.lead_id = lqolead.lead;
        const raw = await proxying(method, endpoint, header, param, body, true);
        let response = JSON.parse(raw.data)
        console.log(`[${response.message}] Postback LQO : [${body.context.user.lead_id}] Event> ${body.event}`)
    }

    if(lqolead.hasOwnProperty("credit")) {
        let body = Object.assign({}, TempRegistration);
        if(lqolead.credit.toLowerCase() === 'high') {
            body.event = "HighCredit";
        } else if (lqolead.credit.toLowerCase() === 'low') {
            body.event = "LowCredit";
        } else if (lqolead.credit.toUpperCase() === 'NEGATIVE') {
            body.event = "ZeroCredit";
        } else {
            body.event = "UnknownCredit"
        }

        if(body.event != "UnknownCredit" ) {
            body.timestamp = lqolead.loandisbursal.replace(' ', 'T') + ':00Z';
            body.context.user.lead_id = lqolead.lead;
            const raw = await proxying(method, endpoint, header, param, body, true);
            let response = JSON.parse(raw.data)
            console.log(`[${response.message}] Postback LQO : [${body.context.user.lead_id}] Event> ${body.event}`)
        }
    }

    if(lqolead.hasOwnProperty("loanapply") && lqolead.loanapply.indexOf('2023')==0) {
        let body = Object.assign({}, TempRegistration);
        body.event = "LoanApply";
        body.timestamp = lqolead.loanapply.replace(' ', 'T') + ':00Z';
        body.context.user.lead_id = lqolead.lead;
        const raw = await proxying(method, endpoint, header, param, body, true);
        let response = JSON.parse(raw.data)
        console.log(`[${response.message}] Postback LQO : [${body.context.user.lead_id}] Event> ${body.event}`)
    }

    if(lqolead.hasOwnProperty("loanapproval") && lqolead.loanapproval.indexOf('2023')==0) {
        let body = Object.assign({}, TempRegistration);
        body.event = "LoanApproval";
        body.timestamp = lqolead.loanapproval.replace(' ', 'T') + ':00Z';
        body.context.user.lead_id = lqolead.lead;
        const raw = await proxying(method, endpoint, header, param, body, true);
        let response = JSON.parse(raw.data)
        console.log(`[${response.message}] Postback LQO : [${body.context.user.lead_id}] Event> ${body.event}`)
    }
}


async function run() {
    let lqoleads = await build_leads();
    for(let i = 0; i < lqoleads.length; i++) {
        lqo = lqoleads[i];
        await postback(lqo)


        // if(i==10) break;

    }

    // console.table(lqoleads);
}


run();
