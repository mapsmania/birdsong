const map = new maplibregl.Map({
    container: 'map',
    style: 'https://tiles.openfreemap.org/styles/positron',
    center: [-81.5, 27.8],
    zoom: 6
  });

  map.addControl(new maplibregl.NavigationControl(), 'top-right');
  map.addControl(new maplibregl.AttributionControl({
    compact: true,
    customAttribution: '<a href="https://xeno-canto.org/" target="_blank">Wildlife recordings © Xeno-Canto</a>'
  }), 'bottom-right');

  /**
   * Load a JSON feed and update the map with its data.
   * Automatically zooms to the bounds of the data.
   */
  async function loadFeed(jsonFile) {
    try {
      const res = await fetch(jsonFile);
      const data = await res.json();

      const features = (data.recordings || [])
        .filter(r => r.lat && r.lon && !isNaN(parseFloat(r.lat)) && !isNaN(parseFloat(r.lon)))
        .map(r => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [parseFloat(r.lon), parseFloat(r.lat)] },
          properties: {
            en: r.en || '',
            gen: r.gen || '',
            sp: r.sp || '',
            loc: r.loc || '',
            file: r.file || '',
            image: r.sono?.small ? `https:${r.sono.small}` : ''
          }
        }));

      const geojson = { type: 'FeatureCollection', features };

      // 🎨 Choose color per dataset
      const color = {
        'frogs.json': '#2a9d8f',          // teal
        'xeno-suffolk.json': '#e76f51',   // orange
        'mammals.json': '#264653',        // dark blue-gray
        'owls.json': '#8e44ad'            // purple for owls
      }[jsonFile] || '#000';

      // Update or create source/layer
      if (map.getSource('recordings')) {
        map.getSource('recordings').setData(geojson);
        map.setPaintProperty('recordings-layer', 'circle-color', color);
      } else {
        map.addSource('recordings', { type: 'geojson', data: geojson });

        map.addLayer({
          id: 'recordings-layer',
          type: 'circle',
          source: 'recordings',
          paint: {
            'circle-radius': 6,
            'circle-color': color,
            'circle-stroke-width': 1.5,
            'circle-stroke-color': '#fff',
            'circle-opacity': 0.85,
            'circle-stroke-opacity': 0.9
          }
        });

        // 🪶 Popup for each recording
        map.on('click', 'recordings-layer', e => {
          const p = e.features[0].properties;
          new maplibregl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`
              <strong>${p.en}</strong><br>
              <em>${p.gen} ${p.sp}</em><br>
              ${p.loc}<br><br>
              <audio controls src="${p.file}" style="width:100%"></audio><br>
              ${p.image ? `<img src="${p.image}" width="200">` : ''}
            `)
            .addTo(map);
        });

        map.on('mouseenter', 'recordings-layer', () => map.getCanvas().style.cursor = 'pointer');
        map.on('mouseleave', 'recordings-layer', () => map.getCanvas().style.cursor = '');
      }

      // Fit map to new dataset
      if (features.length > 0) {
        const bounds = new maplibregl.LngLatBounds();
        features.forEach(f => bounds.extend(f.geometry.coordinates));
        map.fitBounds(bounds, { padding: 80, duration: 1000 });
      }
    } catch (err) {
      console.error(`Failed to load ${jsonFile}:`, err);
    }
  }

  // Default dataset
  map.on('load', () => loadFeed('frogs.json'));

  // Sidebar button handlers
  document.getElementById('birdBtn').onclick = () => loadFeed('xeno-suffolk.json');
  document.getElementById('frogBtn').onclick = () => loadFeed('frogs.json');
  document.getElementById('horseBtn').onclick = () => loadFeed('mammals.json');
  document.getElementById('owlBtn').onclick = () => loadFeed('owls.json'); // 🦉 Added line
