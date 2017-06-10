const requestOptions = {
  headers: {
    'User-Agent': 'request'
  },
  gzip: true,
  resolveWithFullResponse: true
};

const { URL } = require('url');
const cheerio = require('cheerio');
const contentType = require('content-type');
const request = require('request-promise-native').defaults(requestOptions);

const desiredProtocols = [
  'http',
  'https'
];

const urlFormatOptions = {
  fragment: false
};

function isDesiredUrl(urlObject) {
  if(desiredProtocols.indexOf(urlObject.protocol) === -1) {
    return false;
  }

  if(mime.lookup(urlObject.pathname) !== 'text/html') {
    return false;
  }

  return true;
}

function normalizeUrl(urlObject) {
  // Ensure that urls with the same query parameters in different orders match
  if(urlObject.searchParams) {
    urlObject.searchParams = urlObject.searchParams.sort();
  }

  if(urlObject.hash) {
    urlObject.hash = '';
  }

  // Stringify the URL without the hash fragment
  const stringifiedUrl = url.format(urlObject.toString(), urlFormatOptions);

  // Normalize escaped characters
  const reencodedUrl = encodeURI(decodeURI(stringifiedUrl));

  // Remove trailing parameters
  const strippedUrl = reencodedUrl.replace(/[?\/]+$/i, '');

  return strippedUrl;
}

function extractUrls(response) {
  // If the body isn't HTML we are not interested in it
  const contentTypeObject = contentType.parse(response.headers['content-type']);
  if(contentTypeObject.type !== 'text/html') {
    return [];
  }

  const $ = cheerio.load(response.body);

  const urls = [];
  $('a').each((index, element) => {
    const urlObject = new URL(element.href);
    if(isDesiredUrl(urlObject)) {
      urls.push(normalizeUrl(urlObject));
    }
  });

  return Promise.resolve(urls);
}

module.exports = function(url) {
  return request(url, requestOptions)
  .then(extractUrls);
};
