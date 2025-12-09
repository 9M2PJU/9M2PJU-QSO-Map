# MØTRT QSO Map Tool

A utility for amateur radio operators, to show the contents of their log visually on a map. This is what I use to generate maps for my blog posts about portable radio operations.

This was originally intended to be a replacement of sorts for the GMA/Adventure Radio QSO Map tool, sadly now offline. I have since added more features; it also does all the processing client-side rather than using a database and processing on the back end.

![Screenshot](/img/screenshot.png)

Use it at [https://qsomap.m0trt.radio](https://qsomap.m0trt.radio).

### Features

* Load ADIF, Cabrillo & SOTA CSV files
* Combine data from multiple files of any type
* Configurable base maps
* Configurable icons, including POTA/SOTA/etc. symbols
* Maidenhead grid map with worked grid highlighting
* Worked All Britain grid, CQ and ITU zones
* Lots more options for drawing lines, labelling markers etc
* Popup balloons showing your QSO history
* Filter by date, band and mode
* Grid/location lookups using the Spothole API

For upcoming features, see the [issues backlog](https://git.ianrenton.com/ian/qsomap/issues). If you'd like an extra feature, please let me know!

### Privacy

All the code for the QSO map runs locally in your browser, so your log file "uploads" don't leave your computer. Where QSOs are found with missing data, the [Spothole](https://spothole.app) API is queried to fetch the data. No personally identifying information such as your own callsign is transmitted.

The website itself does not use cookies, is not monetised, does not contain advertising, and does not receive or store any user data. It is open source and the code is released into the Public Domain.

### Third Party Libraries

This project contains a self-hosted variant of `dxcc.json` from [this project](https://github.com/k0swe/dxcc-json/) by Chris K0SWE, in the `/data/` directory. This is subject to the Apache licence and is not covered by the overall licence declared in the `LICENSE` file, and used with many thanks.

It also contains a self-hosted copy of Font Awesome's free library, in the `/fa/` directory. This is subject to Font Awesome's licence. This approach was taken in preference to using their hosted kits due to the popularity of this project exceeding the page view limit for their free hosted offering.

Other third party libraries, such as Leaflet and jQuery, plus many plugins for them, are included from a CDN in the head of `index.html`.

This project would not have been possible without these libraries, so many thanks to their developers.

Particular thanks are due to HA8TKS for the Maidenhead, CQ and ITU zone layers, which were also the basis for my own WAB/WAI grid layer.

### Alternatives

If this software doesn't quite scratch the itch for you, you could consider:

* The popular [GridTracker](https://gridtracker.org/) application offers similar features plus integration with logbooks and digimode software.
* The online [ADIF Processor](https://www.adif.uk/) by M0NOM which can generate KML files for viewing in Google Earth etc. This provides its own location lookup, has some nice features such as estimating HF "hops", and using Google Earth likely provides better performance once you get into hundreds of QSOs.
* For SOTA activations, the Sotadata website itself will produce some basic maps for you; there's also [sotamaps.org](https://www.sotamaps.org/) which gives a better view and also provides various statistics about your activations.
* The [ON6ZQ Log2Map tool](https://on6zq.be/w/index.php/Log2Map/HomePage)
* The original [GMA/Adventure Radio QSO Map](http://qsomap.adventureradio.de/) is planned to return at some point.
