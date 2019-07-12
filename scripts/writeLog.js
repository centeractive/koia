// Generates a log file (<targetFile>) with the desired number of entries (<count>) 
// containing an Amount field each with a value equaly spread from <minValue> to <maxValue> 
// 
// The script is started from within the Node.js command prompt as follows:
//   node ./writeLog.js <count> <minValue> <maxValue> <targetFile>
//
const args = process.argv.slice(2)
if (args.length != 4) {
   console.log("Usage: node ./writeLog.js <count> <minValue> <maxValue> <targetFile>");
   return;
}

const columnName = "Amount";
const count = Number(args[0]);
const minValue = Number(args[1]);
const maxValue = Number(args[2]);
const targetFile = args[3];
const diffPerEntry = (maxValue - minValue) / (count - 1);

let data = "";
let value = minValue;
for (let i = 0; i < count - 1; i++) {
   data += new Date().toLocaleString() + " " + columnName + "=" + value.toFixed(3) + "\n";
   value += diffPerEntry;
}
data += new Date().toLocaleString() + " " + columnName + "=" + maxValue;

const fs = require("fs");
fs.writeFile(targetFile, data, err => { 
   if (err) {
      console.log(err);
   } else {
      console.log("The data has been saved to " + targetFile);
   }
}); 