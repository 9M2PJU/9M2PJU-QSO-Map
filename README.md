# ADIF Map Tool

A utility for amateur radio operators, to show the contents of an ADIF file visually on a map. This is what I use to generate maps for my blog posts about portable radio operations.

This was originally intended to be a replacement of sorts for the tool that used to live at [http://qsomap.adventureradio.de/](http://qsomap.adventureradio.de/), sadly now offline. I have since added more features; it also does all the processing client-side rather than using a database and processing on the back end.

![Screenshot](/img/screenshot.png)

Use it at [https://adifmap.m0trt.radio](https://adifmap.m0trt.radio).

### Features

* Configurable base maps
* Configurable icons, including POTA/SOTA/etc. symbols
* Grid lookups from QRZ.com

For upcoming features, see the [issues backlog](https://github.com/ianrenton/adifmap/issues). If you'd like an extra feature, please let me know!

### Privacy

All the code for the ADIF map runs locally in your browser, so your ADIF file "uploads" don't leave your computer. If you enter your QRZ.com username and password to use the lookup service, they are sent to QRZ.com via HTTPS, which encrypts them in transit. The callsigns of your QSO partners are also sent.

The ADIF map website itself does not use cookies, is not monetised, does not contain advertising, and does not receive or store any user data. It is open source and the code is released into the Public Domain.

### Notes

The repository includes a copy of [savy.js](https://github.com/medabida/savy), used with thanks. Other dependencies are all retrieved through CDN.
