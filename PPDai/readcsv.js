const fs = require('fs');

// specify the path to the CSV file
const csvFilePath = 'ppd.csv';
const records = []

// create a read stream from the CSV file
const readStream = fs.createReadStream(csvFilePath, { encoding: 'utf8' });

// create an empty buffer to hold the CSV data
let buffer = '';

// listen for the 'data' event from the read stream
readStream.on('data', (chunk) => {
  // append the chunk to the buffer
  buffer += chunk;

  // split the buffer by newline characters
  const lines = buffer.split(/\r?\n/);

  // process each line
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i];
    // console.log(line);
    const items = line.split(',');

    const req_id = items[2]
    const lead_id = items[4]
    const register = items[5]
    const chuoe     = items[6]
    const loanapply = items[7]
    const loanapproval = items[8]
    const value = items[9]

    // console.log(`${req_id} ${lead_id} ${register} ${chuoe} ${loanapply} ${loanapproval} ${value}`)

    if(req_id.includes('2023')) {
        records.push({
            lead_id,register,chuoe,loanapply,loanapproval,value
        })
    }
  }

  // store the last line as the new buffer
  buffer = lines[lines.length - 1];
});

// listen for the 'end' event from the read stream
readStream.on('end', () => {
  // process the last line
//   console.log(buffer);
});

module.exports = records