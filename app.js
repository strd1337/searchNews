document.addEventListener('DOMContentLoaded', function() {
  M.AutoInit();
  loadNews();
});

function customHttp() {
  return {
    get(url, cb) {
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.addEventListener('load', () => {
          if (Math.floor(xhr.status / 100) !== 2) {
            cb(`Error. Status code: ${xhr.status}`, xhr);
            return;
          }
          const response = JSON.parse(xhr.responseText);
          cb(null, response);
        });

        xhr.addEventListener('error', () => {
          cb(`Error. Status code: ${xhr.status}`, xhr);
        });

        xhr.send();
      } catch (error) {
        cb(error);
      }
    },
    post(url, body, headers, cb) {
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        xhr.addEventListener('load', () => {
          if (Math.floor(xhr.status / 100) !== 2) {
            cb(`Error. Status code: ${xhr.status}`, xhr);
            return;
          }
          const response = JSON.parse(xhr.responseText);
          cb(null, response);
        });

        xhr.addEventListener('error', () => {
          cb(`Error. Status code: ${xhr.status}`, xhr);
        });

        if (headers) {
          Object.entries(headers).forEach(([key, value]) => {
            xhr.setRequestHeader(key, value);
          });
        }

        xhr.send(JSON.stringify(body));
      } catch (error) {
        cb(error);
      }
    },
  };
}

const http = customHttp();

const newsService = (function () {
  // from https://newsapi.org/account
  const apiKey = 'c9fb0d8b165d42dcba9a559099e33701';
  const apiUrl = 'https://newsapi.org/v2';

  return {
    topHeadlines(country = 'ua', category = 'general', cb) {
      http.get(`${apiUrl}/top-headlines?country=${country}&category=${category}&apiKey=${apiKey}`, cb);
    },
    everything(query, cb) {
      http.get(`${apiUrl}/everything?q=${query}&apiKey=${apiKey}`, cb);
    }
  };
})();

const form = document.forms['newsControls'];
const selectedCountry = form.elements['country'];
const selectedCategory = form.elements['category'];
const searchInput = form.elements['search'];

form.addEventListener('submit', event => {
  event.preventDefault();
  loadNews();
})

function loadNews() {
  showPreloader();

  const country = selectedCountry.value;
  const category = selectedCategory.value;
  const searchText = searchInput.value;

  if (!searchText) {
    newsService.topHeadlines(country, category, onGetResponse);
  } else {
    newsService.everything(searchText, onGetResponse);
  }
}

function onGetResponse(error, response) {
  hidePreloader();

  if (error) {
    showAlert(error, 'error-message');
    return;
  }

  if (!response.articles.length) {
    showAlert('There are no news. Please, rewrite your search expression.');
    return;
  }

  renderNews(response.articles);
}

function renderNews(news) { 
  const container = document.querySelector('.news-container .row');

  if (container.children.length) {
    clearContainer(container);
  }

  let fragment = '';

  news.forEach(item => {
    const element = newsTemplate(item);
    fragment += element;
  });

  container.insertAdjacentHTML('afterbegin', fragment);
}

function newsTemplate({ urlToImage, title, url, description }) {
  if (!urlToImage) {
    urlToImage = `/images/noimage_detail.png`;
  }

  return `
    <div class="col s12">
      <div class="card">
        <div class="card-image">
          <img src="${urlToImage}">
          <span class="card-title">${title || ''}</span>
        </div>
        <div class="card-content">
          <p>${description || ''}</p>
        </div>
        <div class="card-action">
          <a href="${url}">Read more</a>
        </div>
      </div>
    </div>
  `;
}

function showAlert(message, type = 'success') {
  M.toast({ html:message, classes: type });
}

function clearContainer(container) {
  let child = container.lastElementChild;
  while(child) {
    container.removeChild(child);
    child = container.lastElementChild;
  }
}

function showPreloader() {
  document.body.insertAdjacentHTML(
    'afterbegin', 
    `<div class="progress">
      <div class="indeterminate"></div>
    </div>`
  );
}

function hidePreloader() {
  const preloader = document.querySelector('.progress');
  if (preloader) {
    preloader.remove();
  }
}
