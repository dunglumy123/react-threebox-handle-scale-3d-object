import { Fragment, useEffect, useState } from "react";
import { Threebox, THREE } from "threebox-plugin";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "threebox-plugin/dist/threebox.css";
import "./styles.css";

export default function App() {
  const key = 'get_your_own_OpIi9ZULNHzrESv6T2vL'
  const [scale, setscale] = useState(1);
  const [selectModel, setselectModel] = useState(null);
  const baseMaps = {
    "streets": {
      name: "streets",
      img: "https://cloud.maptiler.com/static/img/maps/streets.png"
    },
    "winter": {
      name: "winter",
      img: "https://cloud.maptiler.com/static/img/maps/winter.png"
    },
    "hybrid": {
      name: "hybrid",
      img: "https://cloud.maptiler.com/static/img/maps/hybrid.png"
    }
  }
  const initialStyle = Object.keys(baseMaps)[0];

  useEffect(() => {
    let origin = [105.8551955, 21.022772155];
    const map = new maplibregl.Map({
      container: "map",
      center: origin,
      style:
        `https://api.maptiler.com/maps/${initialStyle}/style.json?key=${key}`,
      zoom: 18,
      pitch: 60,
      antialias: true,
      bearing: 0
    });
    let soldier;
    const easing = (t) => {
      return t * (2 - t);
    };

    map.on("style.load", (e) => {
      const onObjectMouseOver = (e) => {
        // console.log("onObjectMouseOver");
      };

      const onSelectedChange = (e) => {
        const selected = e.detail.selected;
        if (selected) {
          setselectModel(e.detail);
        } else {
          setselectModel(null);
        }
      };

      const customLayer = {
        id: "custom_layer",
        type: "custom",
        renderingMode: "3d",
        onAdd: (m, gl) => {
          window.tb = new Threebox(m, gl, {
            defaultLights: true,
            // enableSelectingFeatures: true,
            enableSelectingObjects: true,
            enableDraggingObjects: true,
            enableRotatingObjects: true
            // enableTooltips: true,
          });
          const options = {
            obj: "/hatch_deadpool_dancing.glb",
            type: "gltf",
            scale: 0.2,
            units: "meters",
            rotation: { x: 90, y: 180, z: 0 },
            anchor: "center" //default rotation
          };
      
          window.tb.loadObj(options, (model) => {
            // animate();
           
            soldier = model.setCoords(origin);
            soldier.fixedZoom = scale;
            // Listening to the events
            soldier.addEventListener("SelectedChange", onSelectedChange, false);
            // soldier.addEventListener('Wireframed', onWireframed, false);
            // soldier.addEventListener('IsPlayingChanged', onIsPlayingChanged, false);
            // soldier.addEventListener('ObjectDragged', onDraggedObject, false);
            soldier.addEventListener(
              "ObjectMouseOver",
              onObjectMouseOver,
              false
            );
            // soldier.addEventListener('ObjectMouseOut', onObjectMouseOut, false);
            // soldier.addEventListener('ObjectChanged', onObjectChanged, false);
            soldier.playAnimation({ animation: 1, duration: 1000000000 });
            // soldier.addEventListener("IsPlayingChanged", e => {
            //   console.log(e)
            //   if (!e.detail.isPlaying) {
      
            //     soldier.playAnimation({ animation: 1, duration: 1000000000 });
            //   }
            // },false);
            soldier.addTooltip("Deadpool", true, model.anchor, true, 1);
            soldier.castShadow = true;
            soldier.selected = true;

            window.tb.add(soldier, "soldier");
          });
        },
        render: (gl, metric) => {
          window.tb.update();
        }
      };
      e.target.addLayer(customLayer);
    });
    map.on("load", (e) => {
      map.getCanvas().focus();
      // console.log(e);
      map.getCanvas().addEventListener('blur', () => {
        console.log('====blur')
        map.getCanvas().focus();
      })
    });
    map.on('click', function(e) {
      // When the map is clicked, get the geographic coordinate.
      var coordinate = map.unproject(e.point);
      var pt = [e.lngLat.lng, e.lngLat.lat];
      console.log(pt);
      move(pt)
    });

    let isMoving = false
    const mapJumb = () => {
      if (isMoving) {
        requestAnimationFrame(mapJumb);
        let options = {
          center: soldier.coordinates,
          bearing: map.getBearing(),
          easing: easing
        };
        map.jumpTo(options);
        window.tb.map.update = true;
      }
     
    }
    const move = (coordinate) => {
      var url = "https://api.mapbox.com/directions/v5/mapbox/driving/" + [origin, coordinate].join(';') + "?geometries=geojson&access_token=pk.eyJ1IjoicXVhbmducCIsImEiOiJjbDNjZGVscmkwM2FyM2prbXJqcWw3bHIzIn0.ZrYdsHTgEKEBNGYN1qq5Vw"
      fetchFunction(url, (data) => {
        isMoving = true
        mapJumb()
        let duration = data.routes[0].duration * 100;
        // extract path geometry from callback geojson, and set duration of travel
        var options = {
          animation: 3,
          path: data.routes[0].geometry.coordinates,
          duration: duration
        }

        console.log('duration ' + duration)
        
				// start the soldier animation with above options, and remove the line when animation ends
				soldier.followPath(
					options,
					() => {
            console.log('end')
            // soldier.playAnimation({ animation: 0, duration: 1000000000 });
					}
				);
        soldier.playAnimation(options);

        setTimeout(() => { //Start the timer
          console.log('setTimeout end')
          isMoving = false
          soldier.playAnimation({ animation: 4, duration: 1000000000 });
        }, duration + 100)
        
        // set destination as the new origin, for the next trip
        origin = coordinate;
      })
    }

    function fetchFunction(url, cb) {
			fetch(url)
				.then(
					function (response) {
						if (response.status === 200) {
							response.json()
								.then(function (data) {
									cb(data)
								})
						}
					}
				)
		}
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    class styleSwitcherControl {

      constructor(options) {
        this._options = {...options};
        this._container = document.createElement("div");
        this._container.classList.add("maplibregl-ctrl");
        this._container.classList.add("maplibregl-ctrl-basemaps");
        this._container.classList.add("closed");
        switch (this._options.expandDirection || "right") {
            case "top":
                this._container.classList.add("reverse");
            case "down":
                this._container.classList.add("column");
                break;
            case "left":
                this._container.classList.add("reverse");
            case "right":
                this._container.classList.add("row");
        }
        this._container.addEventListener("mouseenter", () => {
            this._container.classList.remove("closed");
        });
        this._container.addEventListener("mouseleave", () => {
            this._container.classList.add("closed");
        });
      }

      onAdd(map) {
        this._map = map;
        const basemaps = this._options.basemaps;
        Object.keys(basemaps).forEach((layerId) => {
          const base = basemaps[layerId];
          const basemapContainer = document.createElement("img");
          basemapContainer.src = base.img;
          basemapContainer.classList.add("basemap");
          basemapContainer.dataset.id = layerId;
          basemapContainer.addEventListener("click", () => {
            const activeElement = this._container.querySelector(".active");
            activeElement.classList.remove("active");
            basemapContainer.classList.add("active");
            let url_content = `https://api.maptiler.com/maps/${layerId}/style.json?key=${key}`
            map.setStyle(url_content, {diff: false});
          });
          basemapContainer.classList.add("hidden");
          this._container.appendChild(basemapContainer);
          if (this._options.initialBasemap === layerId) {
              basemapContainer.classList.add("active");
          }
        });
        return this._container;
      }

      onRemove(){
        this._container.parentNode?.removeChild(this._container);
        delete this._map;
      }
    }
    map.addControl(new styleSwitcherControl({basemaps: baseMaps, initialBasemap: initialStyle}), 'bottom-left');
  
    return () => {
      map.remove();
    };
  }, []);

  const onChangeScale = (e) => {
    const newScale = Number(e.target.value);
    if (selectModel) {
      const modelInTbIndex = window.tb.world.children.findIndex(
        (model) => model.uuid === selectModel.uuid
      );
      window.tb.world.children[modelInTbIndex].fixedZoom = 10;
      window.tb.world.children[modelInTbIndex].setObjectScale(newScale);
      window.tb.map.repaint = true;
      // window.tb.world.children[modelInTbIndex]._setObject({
      //   scale: newScale
      // });
      setscale(newScale);
    }
  };

  return (
    <Fragment>
      <div id="map" style={{ width: "100vw", height: "100vh" }}>
        {/* <div style={{ position: "absolute", zIndex: 10, display: "flex" }}>
          <p>scale</p>
          <input
            value={scale}
            type={"number"}
            step={1}
            onChange={onChangeScale}
          />
        </div> */}
      </div>
    </Fragment>
  );
}
