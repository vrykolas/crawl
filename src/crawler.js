const scrape = require('./scrape');

scrape('http://powershift.tv')
.then(console.log)
.catch(console.log);
