from flask import Flask, render_template, request, jsonify
import warnings
warnings.filterwarnings('ignore')
import datacube
import io
import odc.algo
import matplotlib
matplotlib.use('Agg')  # Use non-GUI backend
import matplotlib.pyplot as plt
from datacube.utils.cog import write_cog
import base64  # base64 is a module that provides functions for encoding and decoding data in Base64 format.

import numpy as np
from deafrica_tools.plotting import display_map, rgb
dc = datacube.Datacube(app="04_Plotting")

from geopy.geocoders import Nominatim

def get_area_name(latitude, longitude):
    geolocator = Nominatim(user_agent='my-app')  # Initialize the geocoder
    location = geolocator.reverse((latitude, longitude))  # Reverse geocode the coordinates
    if location is not None:
        address_components = location.raw['address']
        city_name = address_components.get('city', '')
        if not city_name:
            city_name = address_components.get('town', '')
        if not city_name:
            city_name = address_components.get('village', '')
        return city_name
    else:
        return "City name not found"

app = Flask(__name__)

@app.route("/")
def hello_world():
    return render_template("index2.html")

@app.route('/my_flask_route', methods=['GET', 'POST'])
def my_flask_function():
    if request.method == "POST":
        lmin = request.json['lat_min']
        lmax = request.json['lat_max']
        lnmin = request.json['lng_min']
        lnmax = request.json['lng_max']
        td = request.json['todate']
        fd = request.json['fromdate']
        index = request.json['index']

        lat_range = (lmin, lmax)
        lon_range = (lnmin, lnmax)
        print(lat_range, lon_range)
        if(td=="" or fd==""):
            query = {
                "measurements":["B04_10m","B03_10m","B02_10m", "B08_10m", "SCL_20m"],
                "x":lon_range,
                "y":lat_range,
                "output_crs":'EPSG:6933',
                "resolution":(-30, 30)
            }
        else:
            query = {
                "measurements":["B04_10m","B03_10m","B02_10m", "B08_10m", "SCL_20m"],
                "x":lon_range,
                "y":lat_range,
                "time": (fd, td),
                "output_crs":'EPSG:6933',
                "resolution":(-30, 30)
            }
        # display_map(x=lon_range, y=lat_range)
        try:
            ds = dc.load(product="s2a_sen2cor_granule",**query)
            dataset = ds
            dataset =  odc.algo.to_f32(dataset)
            if(index == 'NDVI'):
                band_diff = dataset.B08_10m - dataset.B04_10m
                band_sum = dataset.B08_10m + dataset.B04_10m
                index = band_diff/band_sum
            else:
                band_diff = dataset.B03_10m - dataset.B08_10m
                band_sum = dataset.B03_10m + dataset.B08_10m

                # Calculate NDVI and store it as a measurement in the original dataset
                index = band_diff / band_sum

        except Exception as e:
            return jsonify({'error': "No Data Found"})

        # Calculate NDVI and store it as a measurement in the original dataset
        labels = list(map(lambda x: x.split('T')[0], [i for i in np.datetime_as_string(index.time.values).tolist()]))


        masked_ds_mean = index.mean(dim=['x', 'y'], skipna=True)
        # mean_ndvi = selected_times.mean(dim='time')  # Calculate the mean along the 'time' dimension

        # Print the resulting mean_ndvi
        area_name = get_area_name(np.mean(lat_range), np.mean(lon_range))
                # print(area_name)
        data = list(map(lambda x:round(x, 4), masked_ds_mean.values.tolist()))
        plt.figure(figsize=(8, 8))
        subset = index.isel(time=[0, -1])
        subset.plot(col='time', vmin=0, vmax=1, col_wrap=2)
        img_buffer = io.BytesIO()
        plt.savefig(img_buffer, format='png')
        img_buffer.seek(0)
        # plt.savefig('./static/my_plot.png')
        # Serve the image file in the Flask app
        img_base64 = base64.b64encode(img_buffer.getvalue()).decode()

    # Return the base64 encoded PNG image as JSON
        return jsonify({'image': img_base64, 'labels': labels, 'data': data, 'area': area_name})
    # Calculate the components that make up the NDVI calculation
app.run(debug=True)