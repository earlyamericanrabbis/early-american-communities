# Early American Communities

The towns and cities of early American Jewry — the rabbanim who served them, their shuls, mikvaos and chinuch, and the news and events of their day. A project of **Machon Artzos HaBris HaKadmon**, alongside [Early American Rabbis](https://earlyamericanrabbis.github.io/early-american-seforim/).

**See it online: https://earlyamericanrabbis.github.io/early-american-communities/**

- **The map**: every community is a pin on a map of the United States. Click a pin to open the community.
- **Each community** has its own page: introduction, cover photo, and five sections — Rabbanim That Served Here, Shuls, Mikvaos, Chinuch, and Interesting News & Events — with photos and documents.
- **Rabbanim link up automatically**: every rabbi on the Early American Rabbis site whose "Communities served" includes the city (e.g. `South Bend, IN`) appears on that city's page.

## Adding to the site

The easy way is the form editor at **/admin/** (https://earlyamericanrabbis.github.io/early-american-communities/admin/). Sign in with GitHub, open **Communities**, and add or edit a city. See **[HOW-TO-ADD-CONTENT.md](HOW-TO-ADD-CONTENT.md)**.

## How the repository is laid out

```
_communities/  one file per city (everything about it is in that one file)
_layouts/      page designs (rarely need changing)
_includes/     small reusable page pieces, including the U.S. map
_data/         state names
admin/         the form editor (/admin/)
assets/        photos and documents (assets/uploads), and the site's look (css, js)
templates/     a blank community file to copy
```

## The website

The site is published by GitHub Pages from the **main** branch (Settings → Pages). Every change you commit appears on the site within a minute or two.

If the repository is ever renamed, change the `baseurl` line in `_config.yml` to match.
