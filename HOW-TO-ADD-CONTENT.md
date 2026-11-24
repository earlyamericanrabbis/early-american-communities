# How to add to Early American Communities

You never need a terminal or any programming. Everything is done in your web browser, and the website updates by itself within a minute or two after you save.

## The easy way: the form editor

1. Go to **https://earlyamericanrabbis.github.io/early-american-communities/admin/**
2. Click **Sign in with GitHub** (the same account as Early American Rabbis).
3. Open **Communities**.

### Adding a city

1. Click **New Community**.
2. Fill in the **City name** and **State**.
3. **Latitude and Longitude** put the pin on the map. On Google Maps, right-click the city: the first number is the latitude (e.g. `41.6764`), the second is the longitude (e.g. `-86.2520`). Click either number in Google Maps to copy both.
4. Add the **Years of the community**, a **Cover photo** and an **Introduction** if you have them.
5. Click **Save**. The city appears on the map.

To keep a city off the site while you work on it, turn off **Show on the site**.

### Adding rabbanim, shuls, mikvaos, chinuch and news

Each city's form has five lists. Click **Add** under any of them:

| Section | What to fill in |
|---|---|
| **Rabbanim That Served Here** | Name, Hebrew name, position, years served, link, notes, photos |
| **Shuls** | Name, Hebrew name, also known as / nusach, years, address, history, photos, documents |
| **Mikvaos** | Name or location, years, address, history, photos, documents |
| **Chinuch** | Name, Hebrew name, type (cheder, Talmud Torah, day school, yeshiva), years, address, history, photos, documents |
| **Interesting News & Events** | Headline, date, source, story, photos, documents, link |

- **Photos**: click **Add Photo**, upload the picture, and write a caption. The first photo is the main one; drag to reorder.
- **Documents**: newspaper clippings, PDFs and scans. Give each one a title, like *South Bend Tribune, March 4, 1912*.
- **Order**: entries appear on the page in the order of the list. Drag them to reorder (put news in date order).

## Rabbanim from Early American Rabbis appear on their own

You don't need to retype rabbis who are already on the Early American Rabbis site. On a rabbi's page there, the **Communities served** list is written like `South Bend, IN`. Every rabbi whose list includes the city shows up under **Rabbanim That Served Here**, with his portrait and a link to his biography.

- If Early American Rabbis spells the place differently (e.g. `Mishawaka, IN` for a South Bend rav), add that spelling to the city's **Other spellings for matching rabbis**.
- If you also add a rabbi here by hand with the same name, he appears once, linked to his biography.

## The other way: editing files on github.com

Each city is one text file in the `_communities/` folder (e.g. `south-bend-in.md`). The `templates/community.md` file is a filled-in example of every field: copy it into a new file in `_communities/`, change the details, and click **Commit changes**. Photos and documents go in `assets/uploads/`.
