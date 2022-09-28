import { Fragment, useEffect, useState } from "react";
import { Threebox, THREE } from "threebox-plugin";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "threebox-plugin/dist/threebox.css";
import "./styles.css";
import * as d3 from "d3";

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
  const initialStyle = Object.keys(baseMaps)[1];

  useEffect(() => {
    let originHouse = [105.8578344, 21.02412502833]
    let origin = [105.85698086932342, 21.024255509224687];
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
    console.log( `https://api.maptiler.com/maps/${initialStyle}/style.json?key=${key}`)
    let soldier;
    const easing = (t) => {
      return t * (2 - t);
    };
    const r = 255 * 0.65;
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

          const optionsHouse = {
            obj: "/opera_house.glb",
            type: "gltf",
            scale: 0.03,
            units: "meters",
            rotation: { x: 90, y: -18, z: 0 },
            anchor: "center" //default rotation
          };
          window.tb.loadObj(optionsHouse, (model) => {
            let house = model.setCoords(originHouse);
            house.fixedZoom = scale;
            window.tb.add(house, "house");
          })
          const options = {
            obj: "/girl__character_walk.glb",
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
            soldier.playAnimation({ animation: 0, duration: 1000000000 });
            // soldier.addEventListener("IsPlayingChanged", e => {
            //   console.log(e)
            //   if (!e.detail.isPlaying) {
      
            //     soldier.playAnimation({ animation: 1, duration: 1000000000 });
            //   }
            // },false);
            //soldier.addTooltip("Deadpool", true, model.anchor, true, 1);
            soldier.castShadow = true;
            soldier.selected = true;

            window.tb.add(soldier, "soldier");

            // map.addSource('building', {
            //   'type': 'geojson',
            //   'data': './hanoi.geojson'
            // });
  
            // map.addLayer({
            //   'id': 'room-extrusion',
            //   'type': 'fill-extrusion',
            //   'source': 'building',
            //   'paint': {
            //   // See the MapLibre Style Specification for details on data expressions.
            //   // https://maplibre.org/maplibre-gl-js-docs/style-spec/expressions/
               
            //   // Get the fill-extrusion-color from the source 'color' property.
            //   'fill-extrusion-color': ['get', 'color'],
               
            //   // Get fill-extrusion-height from the source 'height' property.
            //   'fill-extrusion-height': ['get', 'height'],
               
            //   // Get fill-extrusion-base from the source 'base_height' property.
            //   'fill-extrusion-base': ['get', 'base_height'],
               
            //   // Make extrusions slightly opaque for see through indoor walls.
            //   'fill-extrusion-opacity': 0.5
            //   }
            //   });

            d3.json('./hanoi.geojson').then(function (fc) {
              console.log(fc);
              //then we create the extrusions based on the geoJson features
              addBuildings(fc.features);
            })
  
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
      console.log(e);
      map.getCanvas().addEventListener('blur', () => {
        console.log('====blur')
        map.getCanvas().focus();
      })
    });

    // map.on('tiledata', function(data){
    //     console.log(data)
    // });
    // map.on('sourcedata',  function(data){
    //   console.log(data)
    // });

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
          animation: 0,
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
        // soldier.playAnimation(options);

        // setTimeout(() => { //Start the timer
        //   console.log('setTimeout end')
        //   isMoving = false
        //   console.log(soldier)
        //   soldier.playAnimation({ name: 'TPose', duration: 1000000000 });
        // }, duration + 100)
        
        // set destination as the new origin, for the next trip
        origin = coordinate;
      })
    }

    const fetchFunction = (url, cb) => {
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
    let redMaterial = new THREE.MeshPhongMaterial({
			color: 0x660000,
			side: THREE.DoubleSide
		});

    function addBuildings(data, info, height = 1) {

			data.forEach((b) => {
				let center = b.properties.center;
				let s = window.tb.projectedUnitsPerMeter(center[1]);

				let extrusion = window.tb.extrusion({
					coordinates: b.geometry.coordinates,
					geometryOptions: { curveSegments: 1, bevelEnabled: false, depth: b.layer.paint["fill-extrusion-height"] * s },
					materials: redMaterial
				});
				extrusion.addTooltip(b.properties.tooltip, true);
				extrusion.setCoords([center[0], center[1], 0]);
				window.tb.add(extrusion);

			});
		}
  
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
