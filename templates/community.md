---
name: "City Name"
state: IN                              # two-letter postal code
hebrew_name:                           # optional
lat: 41.6764                           # from Google Maps: right-click the city, first number
lon: -86.2520                          # second number (negative in the U.S.)
era: "1870s–1960s"                     # optional
cover:                                 # e.g. /assets/uploads/south-bend.jpg
cover_caption:
published: true                        # false keeps it off the site (a draft)

# Rabbis already on Early American Rabbis whose "communities" include
# "City Name, ST" appear automatically. Add any others here.
rabbanim:
  - name: "Rabbi Firstname Lastname"
    hebrew_name:
    position: "Rav of Congregation ..."
    years: "1905–1932"
    link:                              # e.g. his Early American Rabbis page
    notes:
    images:
      - image: /assets/uploads/photo.jpg
        caption: ""

shuls:
  - name: "Congregation ..."
    hebrew_name:
    also_known_as:
    years: "1887–1960"
    address:
    notes: |
      History of the shul. Leave a blank line between paragraphs.
    images:
      - image: /assets/uploads/shul.jpg
        caption: ""
    documents:
      - title: "Dedication program, 1912"
        file: /assets/uploads/dedication-1912.pdf
    link:

mikvaos:
  - name: "Community Mikvah"
    years:
    address:
    notes:
    images: []
    documents: []

chinuch:
  - name: "Talmud Torah"
    hebrew_name:
    type: "Talmud Torah"
    years:
    address:
    notes:
    images: []
    documents: []

cemeteries:
  - name: "Hebrew Orthodox Cemetery"
    hebrew_name:
    also_known_as: "Chevra Kadisha of Congregation ..."
    years: "founded 1884"
    address:
    notes:
    images: []
    documents: []
    link:

news:
  - headline: "New shul dedicated"
    date: "March 4, 1912"
    source: "South Bend Tribune"
    story: |
      What happened.
    images: []
    documents: []
    link:

rabbi_places: []                       # other spellings used on Early American Rabbis, e.g. "Mishawaka, IN"
sources: []
---

Introduction to the community goes here, below the second line of dashes.
