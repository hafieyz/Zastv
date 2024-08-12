# Zastv

## Overview
**Zastv** is a web-based video streaming application that allows users to watch live streams with an integrated Electronic Program Guide (EPG) for channel listings and schedules. The application supports multiple video formats, including DASH (`.mpd`), HLS (`.m3u8`), and AAC (`.aac`), and features custom video controls, EPG display, and channel icons.

## Features
- **Multi-Format Video Streaming**: Supports DASH, HLS, and AAC streams.
- **Integrated EPG**: Displays current and upcoming programs with time schedules.
- **Custom Video Controls**: Utilizes Plyr for enhanced video control options.
- **Channel Icons**: Shows channel logos, especially for audio-only streams.
- **Dynamic EPG Loading**: Loads EPG data in batches for better performance.

## Installation
To install and run the project locally:

```bash
# Clone the repository
git clone https://github.com/hafieyz/Zastv.git

# Navigate into the project directory
cd Zastv

# Open the index.html in your preferred browser
```

## Usage
1. Launch the application by opening `index.html`.
2. The main interface will load available video streams.
3. Click on any channel to start streaming.
4. The EPG will display current and upcoming shows, with an on-hover tooltip showing detailed information.
5. To change the M3U8 source, edit the `source.js` file.
6. To modify the EPG source, update the `fetchEPG` function in `app.js`.

## Credits
- **M3U8 Source**: Thanks to [weareblahs](https://github.com/weareblahs) for providing the MyFreeview M3U8 source.
- **EPG Data**: Special thanks to [Aqfadtv](https://github.com/AqFad2811) for the EPG data.
- **Video Player**: This application was built using the [Plyr](https://github.com/sampotts/plyr) video player.

## Contributing
Contributions are welcome! Please fork the repository, create a new branch, and submit a pull request.

## License
This project is licensed under the MIT License.

## Contact
For questions or feedback, reach out to Hafiz at Hafieyzamirudin@gmail.com.

---

This README should now cover all the details you need for your project!
