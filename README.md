# Personal website

A static site: `index.html` is the layout, and every piece of content is loaded from the files below. You never need to touch the HTML to update the site.

| To change…                         | Edit this file              |
|------------------------------------|-----------------------------|
| Name, photo, affiliation, links, news | `data/profile.json`      |
| About text                         | `content/about.md`          |
| Research intro and themes          | `content/research.md`       |
| Publications                       | `data/publications.json`    |
| CV summary (and CV PDF link)       | `data/cv.json`              |
| List of essays                     | `data/posts.json`           |
| An essay's text                    | `writing/<slug>.md`         |
| Photo, CV PDF, images              | put them in `images/`       |

## Add an essay

1. Write it as Markdown and save it as `writing/my-essay-title.md`.
2. Add an entry at the top of `data/posts.json`:
   ```json
   { "slug": "my-essay-title", "title": "My Essay Title", "date": "2026-11-02", "tag": "Books", "excerpt": "One sentence summary." }
   ```
   The `slug` must match the file name (without `.md`). Its link will be `yoursite/#my-essay-title`.

## Add a publication

Add an object to `data/publications.json`. Write your name in `authors` exactly as it appears in `profile.json` and it will be underlined automatically. Leave `"award": ""` if there is none. `links` can hold any labels (PDF, DOI, Code, Video, Slides…).

## Preview on your computer

The pages load their content with `fetch`, so double-clicking `index.html` will show "Could not load…". Run a local server from this folder instead:

```
python3 -m http.server 8000
```

then open http://localhost:8000.

## Publish free on GitHub Pages

1. Create a repository named `<your-github-username>.github.io`.
2. Upload everything in this folder (including the hidden `.nojekyll` file) to the repository.
3. In the repository, go to **Settings → Pages**, set **Source** to "Deploy from a branch", branch `main`, folder `/ (root)`.
4. After a minute the site is live at `https://<your-github-username>.github.io`.

To update later, edit the files on GitHub (pencil icon) or push changes; the site refreshes within a minute.

JSON is strict: use double quotes and no trailing comma after the last item. If a section shows "Could not load…", check that file at https://jsonlint.com.
