const express = require('express');
const { getPhotos } = require('../lib/photos');

const router = express.Router();

const beginning = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Telescope Background Images</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/png" href="/?t=png&w=200"/>
  <style>
    main {
      display: flex;
      flex-wrap: wrap;
    }
  </style>
</head>
<body>
  <h1>Telescope Background Gallery</h1>
  <main>
`;

const ending = `
  </main>
</body>
</html>
`;

router.get('/', (req, res) => {
  const middle = getPhotos()
    .map((filename) => {
      const url = `/${filename}`;
      return `<a href="${url}"><img src="${url}?w=300&h=300"></a>`;
    })
    .join(' ');

  res.set('Content-Type', 'text/html');
  res.send(beginning + middle + ending);
});

module.exports = router;
