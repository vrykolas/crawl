const requestOptions = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
  },
  gzip: true,
  resolveWithFullResponse: true
};

const { URL } = require('url');
const _ = require('lodash');
const cheerio = require('cheerio');
const contentType = require('content-type');
const mimeTypes = require('mime-types');
const request = require('request-promise-native').defaults(requestOptions);
const urlModule = require('url');

const desiredProtocols = [
  'http:',
  'https:'
];

const urlFormatOptions = {
  fragment: false
};

function isDesiredUrl(urlObject) {
  if(desiredProtocols.indexOf(urlObject.protocol) === -1) {
    return false;
  }

  const mimeType = mimeTypes.lookup(urlObject.pathname);
  if(mimeType && mimeType !== 'text/html') {
    return false;
  }

  return true;
}

function normalizeUrl(urlObject) {
  // Ensure that urls with the same query parameters in different orders match
  if(urlObject.searchParams) {
    urlObject.searchParams = urlObject.searchParams.sort();
  }

  // Stringify the URL without the hash fragment
  urlObject.hash = '';
  const stringifiedUrl = urlModule.format(urlObject.toString(), urlFormatOptions);

  // Normalize escaped characters
  const reencodedUrl = encodeURI(decodeURI(stringifiedUrl));

  // Remove trailing parameters
  const strippedUrl = reencodedUrl.replace(/[?\/]+$/i, '');

  return strippedUrl;
}

function generateBaseUrl(pageUrl, baseUrl) {
  const url = pageUrl;
  if(baseUrl) {
    url = baseUrl;
  }

  // Remove querystring and hash fragment from the base url
  const urlObject = new URL(url);
  urlObject.search = '';
  urlObject.hash = '';

  // Append a slash to the baseurl if required
  if(!/\/$/.test(urlObject.href)) {
    return urlObject.href + '/';
  }
  return urlObject.href;
}

function extractUrls(response) {
  // If the body isn't HTML we are not interested in it
  const contentTypeObject = contentType.parse(response.headers['content-type']);
  if(contentTypeObject.type !== 'text/html') {
    return [];
  }

  const $ = cheerio.load(response.body);

  const pageUrl = response.request.href;
  let baseSrc = '';
  const $baseElement = $('base');
  if($baseElement) {
    baseSrc = $baseElement.prop('src');
  }
  const baseUrl = generateBaseUrl(response.request.href, baseSrc);

  const urls = [];
  $('a').each((index, element) => {

    if(!element.attribs.href) {
      return;
    }

    //handle absolute/relative urls
    const urlObject = new URL(urlModule.resolve(baseUrl, element.attribs.href));
    if(isDesiredUrl(urlObject)) {
      urls.push(normalizeUrl(urlObject));
    }
  });

  return Promise.resolve(_.uniq(urls));
}

module.exports = function(url) {
  return request(url, requestOptions)
  .then(extractUrls);
};
