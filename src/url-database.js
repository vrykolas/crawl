const URL_STATE_NEW = 0;

class urlDatabase() {
  constructor() {
    this.urls = [];
  }

  add(url) {
    const hasUrl = _.find(this.urls, { url: url });
    if(!hasUrl) {
      urls.push({
        url: url,
        hash: '',
        state: URL_STATE_NEW,
        referencedUrls: []
      });
    }

    return true;
  }

  update(url, state) {
    const urlObject = _.find(this.urls, { url: url });
    if(!urlObject) {
      throw(new Error('URL not found'));
    }

    urlObject.state = state;
    return true;
  }
}

module.export = {
  URLDatabase: URLDatabase
};
