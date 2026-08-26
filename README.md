# Portfolio — Harshal Tawde

Plain HTML, CSS, and JavaScript. No build step, no dependencies, no runtime to install.
Double-click `index.html` and it opens.

```
index.html        Hardware page
software.html     Software page
assets/site.css   All styling
assets/app.js     Renders the pages from the data
assets/data.js    Every project's content — this is the file you edit
images/           Your photos and plots
```

## Adding an image

Drop the file in `images/`, then point at it from `assets/data.js`. Each project
takes up to five:

| Field | Where it shows |
|---|---|
| `card` | The image on the index card |
| `hero` | The wide banner at the top of the case study |
| `gallery[].img` | The three-across strip mid-page |
| `plot` | Next to the analysis section |

```js
{ id:"ecocar", disc:"Structures", rail:"Texas EcoCar", year:"2024—25",
  card:"images/ecocar_card.jpg",
  hero:"images/ecocar_hero.jpg",
  plot:"images/ecocar_fea.png",
  ...
  gallery:[
    { tag:"Baseline", img:"images/ecocar_baseline.jpg", cap:"Original structure — ..." },
    ...
  ]
}
```

Any slot without an image renders a labelled placeholder showing what belongs
there, so nothing looks broken while you fill it in. Projects marked `nda:true`
render the diamond lock pattern instead and ignore image fields.

Size images before adding them — roughly 1600px wide is plenty, and JPEG at 80%
quality for photos. A page full of 8 MB phone pictures loads slowly on a phone,
which is where a lot of people will open this.

## Editing copy

All of it lives in `assets/data.js`. Change the text, save, refresh the browser.
The two pages are `P_HW` and `P_SW`; reorder the array to reorder the site.

## Publishing

**GitHub Pages** — create a repository, upload this folder's contents, then
Settings → Pages → deploy from `main` / root. Live at
`https://<username>.github.io/<repo>/` within a minute or two.

**Netlify Drop** — go to app.netlify.com/drop and drag the folder onto the page.
Instant URL, no account needed to start.

Either way, keep the folder structure intact — the pages reference `assets/` and
`images/` by relative path.

## Still to do

- The **Résumé** button in the top right is a `mailto:` link. To make it serve an
  actual résumé, drop `resume.pdf` in this folder and change the `href` in both
  `index.html` and `software.html` to `resume.pdf`.
- The **plot slot on the SLED page** currently reuses a simulation frame. Its
  caption promises predicted-versus-measured film thickness, so swap it when you
  have that figure.
- Every project other than SLED still needs images.

## How the site behaves

**Index** — projects render as a card grid: two across on a laptop, three on a
wide monitor, one on a phone. Each card carries the lead image, discipline and
year badges, title, headline metric, and the first four tags.

**Filtering** — the sticky bar under the nav filters by discipline, and the
search box matches against title, kicker, metric, tags, year, and org. The count
on the right shows how many match. Press `/` anywhere to jump to the search box.

**Lightbox** — every image on a case study opens full-size on click, with its
caption underneath. Arrow keys step through all five images of that project,
Escape closes.

**Keyboard** — on a case study, left and right arrows move between projects and
Escape returns to the index.

**Linkable** — `index.html#wicking` opens that project directly, so you can send
someone straight to one instead of the whole index. A reading-progress bar runs
across the top of case studies.
