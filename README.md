
# US Guinness Price Map

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Technologies Used](#technologies-used)
- [Data Sources](#data-sources)
- [License](#license)
- [Acknowledgements](#acknowledgements)
- [Contact](#contact)

## Overview

The **US Guinness Price Map** is an interactive web application that visualizes the average price of Guinness across different US states. Leveraging **D3.js**, this project allows users to explore various economic metrics related to Guinness pricing, enabling insightful comparisons and analyses. The map is designed to be responsive, ensuring a seamless experience across desktop and mobile devices.

## Features

- **Interactive Map:** Visual representation of Guinness prices across US states with dynamic color scales.
- **Metric Selection:** Choose from multiple metrics such as Regional Price Parity (RPP), Disposable Personal Income (DPI), Big Mac Price, and more.
- **Comparison Mode:** Compare two metrics simultaneously to analyze relationships and affordability.
- **Custom Price Input:** Enter a custom price to see how it compares with actual Guinness prices.
- **Suggestions:** Get guided suggestions to explore different aspects of the data.
- **Responsive Design:** Optimized for both desktop and mobile devices for enhanced user experience.
- **Data Tables:** View top 3 and bottom 3 states based on selected metrics for quick insights.
- **Tooltips:** Hover over states to see detailed information and formatted data.
- **Zoom Controls:** Easily navigate the map with zoom in, zoom out, and reset view functionalities.

## Installation

To set up and run the project, follow these steps:

### Prerequisites

- **Web Browser:** Modern browsers like Chrome, Firefox, or Edge.
- **Local Server (Optional):** For optimal performance and to handle local file loading, it's recommended to use a local server.

### Steps

#### Option 1: Using the online link
You can access a GitHub Pages version at the following link, which should work fine on all devices:
https://jamesnbryant.github.io/guinness-price-mapUS/
#### Option 2: Cloning the repo for yourself
1. **Clone the Repository:**

   ```bash
   git clone https://github.com/yourusername/us-guinness-price-map.git
   ```

2. **Navigate to the Project Directory:**

   ```bash
   cd us-guinness-price-map
   ```

3. **Run the Application:**

   - **Option 1:** Open the `index.html` file directly in your web browser.
   - **Option 2 (Recommended):** Use a local server for better performance.

     - **Using Python (for Python 3.x):**

       ```bash
       python -m http.server
       ```

       Then, navigate to `http://localhost:8000` in your browser.

     - **Using Live Server Extension (VS Code):**
       - Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension.
       - Right-click on `index.html` and select "Open with Live Server".

## Usage

1. **Select a Metric:**
   - Use the first dropdown to choose a primary metric to visualize on the map.

2. **Compare with Another Metric (Optional):**
   - Check the "Compare with another metric" checkbox.
   - Select a secondary metric from the second dropdown to compare.

3. **Enter a Custom Price (Optional):**
   - If "Custom Value" is selected in the secondary metric, input your custom price in the provided field.

4. **Show Suggestions:**
   - Click the "Show Suggestions" button to receive guided suggestions for exploring the data.

5. **Reset:**
   - Click the "Reset" button to revert all selections to default values.

6. **Interact with the Map:**
   - Hover over states to view tooltips with detailed information.
   - Use the zoom controls to navigate the map:
     - **Plus (+):** Zoom in.
     - **Minus (-):** Zoom out.
     - **Reset View:** Return to the initial view.

7. **View Data Tables:**
   - Scroll down to see the "Top 3 States" and "Bottom 3 States" based on the selected metrics.

## Project Structure

```
us-guinness-price-map/
├── index.html
├── styles.css
├── script.js
├── us-states.geojson
├── data.csv
├── README.md
└── assets/
    └── screenshot.png
```

- **index.html:** The main HTML file containing the structure of the web application.
- **styles.css:** CSS file for styling the application.
- **script.js:** JavaScript file containing the D3.js code for map visualization and interactivity.
- **us-states.geojson:** GeoJSON data for US states boundaries.
- **data.csv:** CSV file containing Guinness pricing and related metrics data.
- **README.md:** Documentation file.

## Technologies Used

- **HTML5 & CSS3:** Structure and styling of the web application.
- **JavaScript (ES6):** Functionality and interactivity.
- **D3.js v6:** Data visualization library for creating the interactive map.
- **D3-Scale-Chromatic:** For color interpolators in the visualization.

## Data Sources

- **US States GeoJSON:** [Source Link](https://eric.clst.org/tech/usgeojson/)
- **Other sources can be found here:** [Source Link](https://docs.google.com/spreadsheets/d/13UHFnUDtmKop-gcair_FXKbpqnKcTvNrQN-iKljSeFo/edit?usp=sharing)

## License

This project can be used by anyone for anything positive, just leave credit where possible if you rely on this heavily for something.
## Acknowledgements

- **D3.js:** Powerful data visualization library.
- **Data Sources:** Thanks to the providers of the GeoJSON and Guinness price data.
- **OpenAI and Anthropic**: o1-Preview and Claude Sonnet 3.5 respectively

## Contact

**James Nicholas Bryant**

- **Email:** [hello@jamesnicholasbryant.ie](mailto:hello@jamesnicholasbryant.ie)
- **Twitter:** [@JamesNBryant](https://twitter.com/JamesNBryant)

Feel free to reach out for any questions or feedback!
