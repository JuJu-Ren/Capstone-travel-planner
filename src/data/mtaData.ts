export interface MTAStop {
  id: string
  name: string
  lat: number
  lng: number
  system: 'LIRR' | 'MetroNorth' | 'PATH'
  lines: string[]
  isHub?: boolean
}

export interface MTALine {
  id: string
  name: string
  system: 'LIRR' | 'MetroNorth' | 'PATH'
  color: string
  coords: [number, number][]
}

// ─── LIRR Stops ───────────────────────────────────────────────────────────────
export const lirrStops: MTAStop[] = [
  // City Terminals
  { id: 'lirr-penn', name: 'Penn Station (NYC)', lat: 40.7506, lng: -73.9934, system: 'LIRR', lines: ['All LIRR lines'], isHub: true },
  { id: 'lirr-atl',  name: 'Atlantic Terminal (Brooklyn)', lat: 40.6842, lng: -73.9773, system: 'LIRR', lines: ['City Terminal Zone'], isHub: true },

  // City Terminal Zone (Queens)
  { id: 'lirr-wds', name: 'Woodside', lat: 40.7449, lng: -73.9018, system: 'LIRR', lines: ['Main Line', 'Port Washington Branch'] },
  { id: 'lirr-fhs', name: 'Forest Hills', lat: 40.7195, lng: -73.8449, system: 'LIRR', lines: ['Main Line'] },
  { id: 'lirr-kwg', name: 'Kew Gardens', lat: 40.7080, lng: -73.8314, system: 'LIRR', lines: ['Main Line'] },

  // Jamaica Hub
  { id: 'lirr-jam', name: 'Jamaica', lat: 40.7012, lng: -73.8085, system: 'LIRR', lines: ['All branches'], isHub: true },

  // Main Line (Jamaica → Ronkonkoma)
  { id: 'lirr-hol', name: 'Hollis', lat: 40.7185, lng: -73.7702, system: 'LIRR', lines: ['Main Line'] },
  { id: 'lirr-qvl', name: 'Queens Village', lat: 40.7191, lng: -73.7393, system: 'LIRR', lines: ['Main Line'] },
  { id: 'lirr-bel', name: 'Bellerose', lat: 40.7214, lng: -73.7197, system: 'LIRR', lines: ['Main Line'] },
  { id: 'lirr-flp', name: 'Floral Park', lat: 40.7226, lng: -73.7016, system: 'LIRR', lines: ['Main Line', 'Hempstead Branch'] },
  { id: 'lirr-nhp', name: 'New Hyde Park', lat: 40.7258, lng: -73.6876, system: 'LIRR', lines: ['Main Line'] },
  { id: 'lirr-mra', name: 'Merillon Avenue', lat: 40.7298, lng: -73.6702, system: 'LIRR', lines: ['Main Line'] },
  { id: 'lirr-min', name: 'Mineola', lat: 40.7491, lng: -73.6432, system: 'LIRR', lines: ['Main Line', 'Oyster Bay Branch'], isHub: true },
  { id: 'lirr-clp', name: 'Carle Place', lat: 40.7542, lng: -73.6084, system: 'LIRR', lines: ['Main Line'] },
  { id: 'lirr-wby', name: 'Westbury', lat: 40.7565, lng: -73.5887, system: 'LIRR', lines: ['Main Line'] },
  { id: 'lirr-hkv', name: 'Hicksville', lat: 40.7679, lng: -73.5227, system: 'LIRR', lines: ['Main Line', 'Port Jefferson Branch', 'Oyster Bay Branch'], isHub: true },
  { id: 'lirr-btp', name: 'Bethpage', lat: 40.7479, lng: -73.4823, system: 'LIRR', lines: ['Main Line', 'Oyster Bay Branch'] },
  { id: 'lirr-fmd', name: 'Farmingdale', lat: 40.7324, lng: -73.4453, system: 'LIRR', lines: ['Main Line'] },
  { id: 'lirr-pin', name: 'Pinelawn', lat: 40.7428, lng: -73.3968, system: 'LIRR', lines: ['Main Line'] },
  { id: 'lirr-wyd', name: 'Wyandanch', lat: 40.7521, lng: -73.3697, system: 'LIRR', lines: ['Main Line'] },
  { id: 'lirr-dep', name: 'Deer Park', lat: 40.7627, lng: -73.3242, system: 'LIRR', lines: ['Main Line'] },
  { id: 'lirr-brt', name: 'Brentwood', lat: 40.7843, lng: -73.2465, system: 'LIRR', lines: ['Main Line'] },
  { id: 'lirr-cis', name: 'Central Islip', lat: 40.7845, lng: -73.1990, system: 'LIRR', lines: ['Main Line'] },
  { id: 'lirr-rnk', name: 'Ronkonkoma', lat: 40.8110, lng: -73.1358, system: 'LIRR', lines: ['Main Line', 'Montauk Branch'], isHub: true },

  // Port Jefferson Branch (Hicksville → Port Jefferson)
  { id: 'lirr-sys', name: 'Syosset', lat: 40.8235, lng: -73.5018, system: 'LIRR', lines: ['Port Jefferson Branch'] },
  { id: 'lirr-csh', name: 'Cold Spring Harbor', lat: 40.8557, lng: -73.4478, system: 'LIRR', lines: ['Port Jefferson Branch'] },
  { id: 'lirr-hnt', name: 'Huntington', lat: 40.8693, lng: -73.4259, system: 'LIRR', lines: ['Port Jefferson Branch'], isHub: true },
  { id: 'lirr-gln', name: 'Greenlawn', lat: 40.8683, lng: -73.3627, system: 'LIRR', lines: ['Port Jefferson Branch'] },
  { id: 'lirr-npt', name: 'Northport', lat: 40.8996, lng: -73.3382, system: 'LIRR', lines: ['Port Jefferson Branch'] },
  { id: 'lirr-kgp', name: 'Kings Park', lat: 40.8845, lng: -73.2681, system: 'LIRR', lines: ['Port Jefferson Branch'] },
  { id: 'lirr-smt', name: 'Smithtown', lat: 40.8598, lng: -73.2066, system: 'LIRR', lines: ['Port Jefferson Branch'] },
  { id: 'lirr-stj', name: 'St. James', lat: 40.8806, lng: -73.1596, system: 'LIRR', lines: ['Port Jefferson Branch'] },
  { id: 'lirr-stb', name: 'Stony Brook', lat: 40.9000, lng: -73.1271, system: 'LIRR', lines: ['Port Jefferson Branch'] },
  { id: 'lirr-pjs', name: 'Port Jefferson Station', lat: 40.9167, lng: -73.0518, system: 'LIRR', lines: ['Port Jefferson Branch'] },
  { id: 'lirr-pjf', name: 'Port Jefferson', lat: 40.9297, lng: -73.0474, system: 'LIRR', lines: ['Port Jefferson Branch'] },

  // Port Washington Branch (Penn Station → Port Washington, via Woodside then NE)
  { id: 'lirr-bnk', name: 'Bayside', lat: 40.7611, lng: -73.7596, system: 'LIRR', lines: ['Port Washington Branch'] },
  { id: 'lirr-dgn', name: 'Douglaston', lat: 40.7697, lng: -73.7460, system: 'LIRR', lines: ['Port Washington Branch'] },
  { id: 'lirr-ltn', name: 'Little Neck', lat: 40.7730, lng: -73.7319, system: 'LIRR', lines: ['Port Washington Branch'] },
  { id: 'lirr-gnk', name: 'Great Neck', lat: 40.7957, lng: -73.7290, system: 'LIRR', lines: ['Port Washington Branch'] },
  { id: 'lirr-kwn', name: 'Kings Point', lat: 40.8193, lng: -73.7258, system: 'LIRR', lines: ['Port Washington Branch'] },
  { id: 'lirr-mhr', name: 'Great Neck (Manor)', lat: 40.8010, lng: -73.7135, system: 'LIRR', lines: ['Port Washington Branch'] },
  { id: 'lirr-prw', name: 'Port Washington', lat: 40.8264, lng: -73.6983, system: 'LIRR', lines: ['Port Washington Branch'] },

  // Babylon Branch / South Shore (Jamaica → Babylon)
  { id: 'lirr-vys', name: 'Valley Stream', lat: 40.6645, lng: -73.7067, system: 'LIRR', lines: ['Babylon Branch', 'Far Rockaway Branch', 'Long Beach Branch', 'West Hempstead Branch'], isHub: true },
  { id: 'lirr-lyn', name: 'Lynbrook', lat: 40.6558, lng: -73.6745, system: 'LIRR', lines: ['Babylon Branch', 'Long Beach Branch'] },
  { id: 'lirr-rvc', name: 'Rockville Centre', lat: 40.6595, lng: -73.6394, system: 'LIRR', lines: ['Babylon Branch', 'Long Beach Branch'] },
  { id: 'lirr-bld', name: 'Baldwin', lat: 40.6584, lng: -73.6114, system: 'LIRR', lines: ['Babylon Branch'] },
  { id: 'lirr-frp', name: 'Freeport', lat: 40.6565, lng: -73.5828, system: 'LIRR', lines: ['Babylon Branch'] },
  { id: 'lirr-mrc', name: 'Merrick', lat: 40.6579, lng: -73.5510, system: 'LIRR', lines: ['Babylon Branch'] },
  { id: 'lirr-blm', name: 'Bellmore', lat: 40.6618, lng: -73.5296, system: 'LIRR', lines: ['Babylon Branch'] },
  { id: 'lirr-wnt', name: 'Wantagh', lat: 40.6660, lng: -73.5093, system: 'LIRR', lines: ['Babylon Branch'] },
  { id: 'lirr-sfd', name: 'Seaford', lat: 40.6673, lng: -73.4871, system: 'LIRR', lines: ['Babylon Branch'] },
  { id: 'lirr-msp', name: 'Massapequa', lat: 40.6817, lng: -73.4657, system: 'LIRR', lines: ['Babylon Branch'] },
  { id: 'lirr-mpp', name: 'Massapequa Park', lat: 40.6817, lng: -73.4538, system: 'LIRR', lines: ['Babylon Branch'] },
  { id: 'lirr-amt', name: 'Amityville', lat: 40.6782, lng: -73.4161, system: 'LIRR', lines: ['Babylon Branch'] },
  { id: 'lirr-cpg', name: 'Copiague', lat: 40.6800, lng: -73.3887, system: 'LIRR', lines: ['Babylon Branch'] },
  { id: 'lirr-lnh', name: 'Lindenhurst', lat: 40.6854, lng: -73.3726, system: 'LIRR', lines: ['Babylon Branch'] },
  { id: 'lirr-bab', name: 'Babylon', lat: 40.7023, lng: -73.3263, system: 'LIRR', lines: ['Babylon Branch', 'Montauk Branch'], isHub: true },

  // Montauk Branch (Babylon → Montauk)
  { id: 'lirr-bys', name: 'Bay Shore', lat: 40.7237, lng: -73.2460, system: 'LIRR', lines: ['Montauk Branch'] },
  { id: 'lirr-isl', name: 'Islip', lat: 40.7293, lng: -73.2103, system: 'LIRR', lines: ['Montauk Branch'] },
  { id: 'lirr-gtr', name: 'Great River', lat: 40.7203, lng: -73.1690, system: 'LIRR', lines: ['Montauk Branch'] },
  { id: 'lirr-oak', name: 'Oakdale', lat: 40.7411, lng: -73.1279, system: 'LIRR', lines: ['Montauk Branch'] },
  { id: 'lirr-syv', name: 'Sayville', lat: 40.7451, lng: -73.0975, system: 'LIRR', lines: ['Montauk Branch'] },
  { id: 'lirr-bhm', name: 'Bohemia', lat: 40.7700, lng: -73.1187, system: 'LIRR', lines: ['Montauk Branch'] },
  { id: 'lirr-ptg', name: 'Patchogue', lat: 40.7648, lng: -73.0159, system: 'LIRR', lines: ['Montauk Branch'] },
  { id: 'lirr-mfd', name: 'Medford', lat: 40.8219, lng: -72.9970, system: 'LIRR', lines: ['Montauk Branch'] },
  { id: 'lirr-ypk', name: 'Yaphank', lat: 40.8330, lng: -72.9129, system: 'LIRR', lines: ['Montauk Branch'] },
  { id: 'lirr-mnk', name: 'Montauk', lat: 41.0445, lng: -71.9546, system: 'LIRR', lines: ['Montauk Branch'] },

  // Far Rockaway Branch (Valley Stream → Far Rockaway)
  { id: 'lirr-ido', name: 'Inwood', lat: 40.6224, lng: -73.7443, system: 'LIRR', lines: ['Far Rockaway Branch'] },
  { id: 'lirr-law', name: 'Lawrence', lat: 40.6152, lng: -73.7337, system: 'LIRR', lines: ['Far Rockaway Branch'] },
  { id: 'lirr-wdm', name: 'Woodmere', lat: 40.6320, lng: -73.7120, system: 'LIRR', lines: ['Far Rockaway Branch'] },
  { id: 'lirr-hfg', name: 'Hewlett', lat: 40.6422, lng: -73.6943, system: 'LIRR', lines: ['Far Rockaway Branch'] },
  { id: 'lirr-frk', name: 'Far Rockaway', lat: 40.6070, lng: -73.7540, system: 'LIRR', lines: ['Far Rockaway Branch'] },

  // Long Beach Branch (Lynbrook → Long Beach)
  { id: 'lirr-ecb', name: 'East Rockaway', lat: 40.6386, lng: -73.6657, system: 'LIRR', lines: ['Long Beach Branch'] },
  { id: 'lirr-osd', name: 'Oceanside', lat: 40.6339, lng: -73.6428, system: 'LIRR', lines: ['Long Beach Branch'] },
  { id: 'lirr-ipk', name: 'Island Park', lat: 40.6062, lng: -73.6551, system: 'LIRR', lines: ['Long Beach Branch'] },
  { id: 'lirr-lnb', name: 'Long Beach', lat: 40.5887, lng: -73.6577, system: 'LIRR', lines: ['Long Beach Branch'] },

  // Hempstead Branch (Floral Park → Hempstead)
  { id: 'lirr-gcd', name: 'Garden City', lat: 40.7265, lng: -73.6349, system: 'LIRR', lines: ['Hempstead Branch'] },
  { id: 'lirr-hpd', name: 'Hempstead', lat: 40.7063, lng: -73.6188, system: 'LIRR', lines: ['Hempstead Branch'] },

  // West Hempstead Branch (Valley Stream → West Hempstead)
  { id: 'lirr-mlv', name: 'Malverne', lat: 40.6742, lng: -73.6719, system: 'LIRR', lines: ['West Hempstead Branch'] },
  { id: 'lirr-wlg', name: 'West Hempstead', lat: 40.6926, lng: -73.6519, system: 'LIRR', lines: ['West Hempstead Branch'] },

  // Oyster Bay Branch (Mineola → Oyster Bay)
  { id: 'lirr-oyb', name: 'Oyster Bay', lat: 40.8696, lng: -73.5312, system: 'LIRR', lines: ['Oyster Bay Branch'] },
]

// ─── Metro-North Stops ────────────────────────────────────────────────────────
export const metroNorthStops: MTAStop[] = [
  // Grand Central Terminal (shared hub)
  { id: 'mn-gct', name: 'Grand Central Terminal', lat: 40.7527, lng: -73.9772, system: 'MetroNorth', lines: ['Hudson Line', 'Harlem Line', 'New Haven Line'], isHub: true },
  { id: 'mn-hrl', name: 'Harlem-125th Street', lat: 40.8054, lng: -73.9367, system: 'MetroNorth', lines: ['Hudson Line', 'Harlem Line'], isHub: true },

  // Hudson Line (Grand Central → Poughkeepsie)
  { id: 'mn-mhl', name: 'Marble Hill', lat: 40.8764, lng: -73.9089, system: 'MetroNorth', lines: ['Hudson Line'] },
  { id: 'mn-spg', name: 'Spuyten Duyvil', lat: 40.8838, lng: -73.9130, system: 'MetroNorth', lines: ['Hudson Line'] },
  { id: 'mn-rv3', name: 'Riverdale', lat: 40.9040, lng: -73.9140, system: 'MetroNorth', lines: ['Hudson Line'] },
  { id: 'mn-ynk', name: 'Yonkers', lat: 40.9313, lng: -73.8810, system: 'MetroNorth', lines: ['Hudson Line'], isHub: true },
  { id: 'mn-gey', name: 'Greystone', lat: 40.9525, lng: -73.8836, system: 'MetroNorth', lines: ['Hudson Line'] },
  { id: 'mn-htg', name: 'Hastings-on-Hudson', lat: 40.9920, lng: -73.8750, system: 'MetroNorth', lines: ['Hudson Line'] },
  { id: 'mn-dbf', name: 'Dobbs Ferry', lat: 41.0095, lng: -73.8743, system: 'MetroNorth', lines: ['Hudson Line'] },
  { id: 'mn-arh', name: 'Ardsley-on-Hudson', lat: 41.0003, lng: -73.8810, system: 'MetroNorth', lines: ['Hudson Line'] },
  { id: 'mn-irv', name: 'Irvington', lat: 41.0390, lng: -73.8680, system: 'MetroNorth', lines: ['Hudson Line'] },
  { id: 'mn-try', name: 'Tarrytown', lat: 41.0634, lng: -73.8665, system: 'MetroNorth', lines: ['Hudson Line'] },
  { id: 'mn-phi', name: 'Philipse Manor', lat: 41.0951, lng: -73.8718, system: 'MetroNorth', lines: ['Hudson Line'] },
  { id: 'mn-scb', name: 'Scarborough', lat: 41.1399, lng: -73.8679, system: 'MetroNorth', lines: ['Hudson Line'] },
  { id: 'mn-oss', name: 'Ossining', lat: 41.1604, lng: -73.8631, system: 'MetroNorth', lines: ['Hudson Line'] },
  { id: 'mn-brc', name: 'Briarcliff Manor', lat: 41.1565, lng: -73.8370, system: 'MetroNorth', lines: ['Hudson Line'] },
  { id: 'mn-cth', name: 'Croton-Harmon', lat: 41.1898, lng: -73.8813, system: 'MetroNorth', lines: ['Hudson Line'], isHub: true },
  { id: 'mn-crt', name: 'Cortlandt', lat: 41.2410, lng: -73.9021, system: 'MetroNorth', lines: ['Hudson Line'] },
  { id: 'mn-pkl', name: 'Peekskill', lat: 41.2845, lng: -73.9194, system: 'MetroNorth', lines: ['Hudson Line'] },
  { id: 'mn-grs', name: 'Garrison', lat: 41.3820, lng: -73.9378, system: 'MetroNorth', lines: ['Hudson Line'] },
  { id: 'mn-cls', name: 'Cold Spring', lat: 41.4167, lng: -73.9521, system: 'MetroNorth', lines: ['Hudson Line'] },
  { id: 'mn-bcn', name: 'Beacon', lat: 41.5037, lng: -73.9693, system: 'MetroNorth', lines: ['Hudson Line'] },
  { id: 'mn-nhg', name: 'New Hamburg', lat: 41.5690, lng: -73.9516, system: 'MetroNorth', lines: ['Hudson Line'] },
  { id: 'mn-pou', name: 'Poughkeepsie', lat: 41.7059, lng: -73.9332, system: 'MetroNorth', lines: ['Hudson Line'], isHub: true },

  // Harlem Line (Grand Central → Wassaic)
  { id: 'mn-wlb', name: 'Woodlawn', lat: 40.8924, lng: -73.8686, system: 'MetroNorth', lines: ['Harlem Line'] },
  { id: 'mn-mvw', name: 'Mount Vernon West', lat: 40.9126, lng: -73.8380, system: 'MetroNorth', lines: ['Harlem Line'] },
  { id: 'mn-flw', name: 'Fleetwood', lat: 40.9256, lng: -73.8280, system: 'MetroNorth', lines: ['Harlem Line'] },
  { id: 'mn-tck', name: 'Tuckahoe', lat: 40.9503, lng: -73.8256, system: 'MetroNorth', lines: ['Harlem Line'] },
  { id: 'mn-cwd', name: 'Crestwood', lat: 40.9597, lng: -73.8141, system: 'MetroNorth', lines: ['Harlem Line'] },
  { id: 'mn-scd', name: 'Scarsdale', lat: 40.9868, lng: -73.7826, system: 'MetroNorth', lines: ['Harlem Line'] },
  { id: 'mn-hrd', name: 'Hartsdale', lat: 40.9793, lng: -73.7985, system: 'MetroNorth', lines: ['Harlem Line'] },
  { id: 'mn-wpl', name: 'White Plains', lat: 41.0334, lng: -73.7629, system: 'MetroNorth', lines: ['Harlem Line'], isHub: true },
  { id: 'mn-nwp', name: 'North White Plains', lat: 41.0551, lng: -73.7824, system: 'MetroNorth', lines: ['Harlem Line'] },
  { id: 'mn-vlh', name: 'Valhalla', lat: 41.0700, lng: -73.7803, system: 'MetroNorth', lines: ['Harlem Line'] },
  { id: 'mn-plv', name: 'Pleasantville', lat: 41.1334, lng: -73.7917, system: 'MetroNorth', lines: ['Harlem Line'] },
  { id: 'mn-hwt', name: 'Hawthorne', lat: 41.1037, lng: -73.7944, system: 'MetroNorth', lines: ['Harlem Line'] },
  { id: 'mn-mtp', name: 'Mount Pleasant', lat: 41.1215, lng: -73.8016, system: 'MetroNorth', lines: ['Harlem Line'] },
  { id: 'mn-chp', name: 'Chappaqua', lat: 41.1593, lng: -73.7714, system: 'MetroNorth', lines: ['Harlem Line'] },
  { id: 'mn-ncs', name: 'Nanuet (Armonk)', lat: 41.1932, lng: -73.7244, system: 'MetroNorth', lines: ['Harlem Line'] },
  { id: 'mn-nca', name: 'North Castle', lat: 41.2188, lng: -73.7098, system: 'MetroNorth', lines: ['Harlem Line'] },
  { id: 'mn-kct', name: 'Katonah', lat: 41.2577, lng: -73.6868, system: 'MetroNorth', lines: ['Harlem Line'] },
  { id: 'mn-bsl', name: 'Bedford Hills', lat: 41.2425, lng: -73.6942, system: 'MetroNorth', lines: ['Harlem Line'] },
  { id: 'mn-bdf', name: 'Bedford', lat: 41.2132, lng: -73.6942, system: 'MetroNorth', lines: ['Harlem Line'] },
  { id: 'mn-skn', name: 'Goldens Bridge', lat: 41.3035, lng: -73.6783, system: 'MetroNorth', lines: ['Harlem Line'] },
  { id: 'mn-smc', name: 'Somers', lat: 41.3376, lng: -73.7087, system: 'MetroNorth', lines: ['Harlem Line'] },
  { id: 'mn-mkv', name: 'Croton Falls', lat: 41.3578, lng: -73.6644, system: 'MetroNorth', lines: ['Harlem Line'] },
  { id: 'mn-pvl', name: 'Purdy\'s', lat: 41.3898, lng: -73.5926, system: 'MetroNorth', lines: ['Harlem Line'] },
  { id: 'mn-ptn', name: 'Patterson', lat: 41.4763, lng: -73.5774, system: 'MetroNorth', lines: ['Harlem Line'] },
  { id: 'mn-grd', name: 'Towners', lat: 41.5196, lng: -73.5630, system: 'MetroNorth', lines: ['Harlem Line'] },
  { id: 'mn-dov', name: 'Dover Plains', lat: 41.7414, lng: -73.5657, system: 'MetroNorth', lines: ['Harlem Line'] },
  { id: 'mn-wsc', name: 'Wassaic', lat: 41.7918, lng: -73.5594, system: 'MetroNorth', lines: ['Harlem Line'] },

  // New Haven Line (Grand Central → New Haven)
  { id: 'mn-nro', name: 'New Rochelle', lat: 40.9090, lng: -73.7745, system: 'MetroNorth', lines: ['New Haven Line'], isHub: true },
  { id: 'mn-lch', name: 'Larchmont', lat: 40.9261, lng: -73.7531, system: 'MetroNorth', lines: ['New Haven Line'] },
  { id: 'mn-mmk', name: 'Mamaroneck', lat: 40.9486, lng: -73.7369, system: 'MetroNorth', lines: ['New Haven Line'] },
  { id: 'mn-hrs', name: 'Harrison', lat: 40.9692, lng: -73.7146, system: 'MetroNorth', lines: ['New Haven Line'] },
  { id: 'mn-rye', name: 'Rye', lat: 40.9812, lng: -73.6870, system: 'MetroNorth', lines: ['New Haven Line'] },
  { id: 'mn-pct', name: 'Port Chester', lat: 41.0041, lng: -73.6656, system: 'MetroNorth', lines: ['New Haven Line'] },
  { id: 'mn-gwh', name: 'Greenwich', lat: 41.0220, lng: -73.6285, system: 'MetroNorth', lines: ['New Haven Line'] },
  { id: 'mn-cgb', name: 'Cos Cob', lat: 41.0346, lng: -73.6015, system: 'MetroNorth', lines: ['New Haven Line'] },
  { id: 'mn-rsd', name: 'Riverside', lat: 41.0367, lng: -73.5847, system: 'MetroNorth', lines: ['New Haven Line'] },
  { id: 'mn-olg', name: 'Old Greenwich', lat: 41.0213, lng: -73.5699, system: 'MetroNorth', lines: ['New Haven Line'] },
  { id: 'mn-stf', name: 'Stamford', lat: 41.0468, lng: -73.5422, system: 'MetroNorth', lines: ['New Haven Line', 'New Canaan Branch'], isHub: true },
  { id: 'mn-nth', name: 'Noroton Heights', lat: 41.0813, lng: -73.5028, system: 'MetroNorth', lines: ['New Haven Line'] },
  { id: 'mn-drn', name: 'Darien', lat: 41.0768, lng: -73.4700, system: 'MetroNorth', lines: ['New Haven Line'] },
  { id: 'mn-rwt', name: 'Rowayton', lat: 41.0886, lng: -73.4450, system: 'MetroNorth', lines: ['New Haven Line'] },
  { id: 'mn-snk', name: 'South Norwalk', lat: 41.0987, lng: -73.4254, system: 'MetroNorth', lines: ['New Haven Line', 'Danbury Branch'], isHub: true },
  { id: 'mn-enk', name: 'East Norwalk', lat: 41.1176, lng: -73.3954, system: 'MetroNorth', lines: ['New Haven Line'] },
  { id: 'mn-wtp', name: 'Westport', lat: 41.1467, lng: -73.3546, system: 'MetroNorth', lines: ['New Haven Line'] },
  { id: 'mn-grf', name: 'Green\'s Farms', lat: 41.1507, lng: -73.3157, system: 'MetroNorth', lines: ['New Haven Line'] },
  { id: 'mn-spt', name: 'Southport', lat: 41.1418, lng: -73.2838, system: 'MetroNorth', lines: ['New Haven Line'] },
  { id: 'mn-ffd', name: 'Fairfield', lat: 41.1414, lng: -73.2641, system: 'MetroNorth', lines: ['New Haven Line'] },
  { id: 'mn-ffm', name: 'Fairfield Metro', lat: 41.1760, lng: -73.2297, system: 'MetroNorth', lines: ['New Haven Line'] },
  { id: 'mn-bdg', name: 'Bridgeport', lat: 41.1772, lng: -73.1853, system: 'MetroNorth', lines: ['New Haven Line'], isHub: true },
  { id: 'mn-std', name: 'Stratford', lat: 41.1981, lng: -73.1316, system: 'MetroNorth', lines: ['New Haven Line'] },
  { id: 'mn-mfd2', name: 'Milford', lat: 41.2228, lng: -73.0579, system: 'MetroNorth', lines: ['New Haven Line'] },
  { id: 'mn-whn', name: 'West Haven', lat: 41.2637, lng: -72.9728, system: 'MetroNorth', lines: ['New Haven Line'] },
  { id: 'mn-nhv', name: 'New Haven State St', lat: 41.3064, lng: -72.9298, system: 'MetroNorth', lines: ['New Haven Line'] },
  { id: 'mn-nhvd', name: 'New Haven Union Station', lat: 41.2983, lng: -72.9279, system: 'MetroNorth', lines: ['New Haven Line'], isHub: true },

  // New Canaan Branch
  { id: 'mn-trl', name: 'Talmadge Hill', lat: 41.0706, lng: -73.5289, system: 'MetroNorth', lines: ['New Canaan Branch'] },
  { id: 'mn-nvl', name: 'New Canaan', lat: 41.1468, lng: -73.4954, system: 'MetroNorth', lines: ['New Canaan Branch'] },

  // Danbury Branch
  { id: 'mn-dnb', name: 'Danbury', lat: 41.3953, lng: -73.4572, system: 'MetroNorth', lines: ['Danbury Branch'] },

  // Port Jervis Line (Hoboken → Port Jervis via NJ)
  { id: 'mn-hob', name: 'Hoboken Terminal', lat: 40.7355, lng: -74.0286, system: 'MetroNorth', lines: ['Port Jervis Line', 'Pascack Valley Line'], isHub: true },
  { id: 'mn-sec', name: 'Secaucus Junction', lat: 40.7614, lng: -74.0748, system: 'MetroNorth', lines: ['Port Jervis Line'] },
  { id: 'mn-rmd', name: 'Ramsey', lat: 41.0584, lng: -74.1397, system: 'MetroNorth', lines: ['Port Jervis Line'] },
  { id: 'mn-suf', name: 'Suffern', lat: 41.1143, lng: -74.1491, system: 'MetroNorth', lines: ['Port Jervis Line'] },
  { id: 'mn-pjv', name: 'Port Jervis', lat: 41.3731, lng: -74.6940, system: 'MetroNorth', lines: ['Port Jervis Line'], isHub: true },

  // Pascack Valley Line (Hoboken → Spring Valley)
  { id: 'mn-hkk', name: 'Hackensack', lat: 40.8848, lng: -74.0435, system: 'MetroNorth', lines: ['Pascack Valley Line'] },
  { id: 'mn-spv', name: 'Spring Valley', lat: 41.1135, lng: -74.0437, system: 'MetroNorth', lines: ['Pascack Valley Line'], isHub: true },
]

// ─── PATH Stops ───────────────────────────────────────────────────────────────
export const pathStops: MTAStop[] = [
  // Manhattan stations
  { id: 'path-33', name: '33rd Street', lat: 40.7488, lng: -74.0050, system: 'PATH', lines: ['JSQ-33rd', 'HOB-33rd'], isHub: true },
  { id: 'path-23', name: '23rd Street', lat: 40.7424, lng: -74.0048, system: 'PATH', lines: ['JSQ-33rd', 'HOB-33rd'] },
  { id: 'path-14', name: '14th Street', lat: 40.7376, lng: -74.0051, system: 'PATH', lines: ['JSQ-33rd', 'HOB-33rd'] },
  { id: 'path-9',  name: '9th Street', lat: 40.7345, lng: -74.0038, system: 'PATH', lines: ['JSQ-33rd', 'HOB-33rd'] },
  { id: 'path-ch', name: 'Christopher Street', lat: 40.7334, lng: -74.0034, system: 'PATH', lines: ['JSQ-33rd', 'HOB-33rd'] },
  { id: 'path-wt', name: 'World Trade Center', lat: 40.7127, lng: -74.0134, system: 'PATH', lines: ['NWK-WTC', 'HOB-WTC'], isHub: true },

  // NJ stations
  { id: 'path-ex', name: 'Exchange Place', lat: 40.7165, lng: -74.0340, system: 'PATH', lines: ['NWK-WTC', 'HOB-WTC', 'JSQ-33rd'] },
  { id: 'path-gs', name: 'Grove Street', lat: 40.7197, lng: -74.0436, system: 'PATH', lines: ['NWK-WTC', 'HOB-WTC', 'JSQ-33rd'] },
  { id: 'path-jq', name: 'Journal Square', lat: 40.7320, lng: -74.0632, system: 'PATH', lines: ['NWK-WTC', 'JSQ-33rd'], isHub: true },
  { id: 'path-hob', name: 'Hoboken', lat: 40.7355, lng: -74.0286, system: 'PATH', lines: ['HOB-WTC', 'HOB-33rd'], isHub: true },
  { id: 'path-hr', name: 'Harrison', lat: 40.7391, lng: -74.1541, system: 'PATH', lines: ['NWK-WTC'] },
  { id: 'path-nwk', name: 'Newark', lat: 40.7345, lng: -74.1641, system: 'PATH', lines: ['NWK-WTC'], isHub: true },
]

// ─── MTA Lines (polylines) ────────────────────────────────────────────────────
export const mtaLines: MTALine[] = [
  // LIRR Main Line
  {
    id: 'lirr-main',
    name: 'LIRR Main Line',
    system: 'LIRR',
    color: '#003087',
    coords: [
      [40.7506, -73.9934], // Penn Station
      [40.7449, -73.9018], // Woodside
      [40.7195, -73.8449], // Forest Hills
      [40.7080, -73.8314], // Kew Gardens
      [40.7012, -73.8085], // Jamaica
      [40.7185, -73.7702], // Hollis
      [40.7191, -73.7393], // Queens Village
      [40.7214, -73.7197], // Bellerose
      [40.7226, -73.7016], // Floral Park
      [40.7258, -73.6876], // New Hyde Park
      [40.7298, -73.6702], // Merillon Ave
      [40.7491, -73.6432], // Mineola
      [40.7542, -73.6084], // Carle Place
      [40.7565, -73.5887], // Westbury
      [40.7679, -73.5227], // Hicksville
      [40.7479, -73.4823], // Bethpage
      [40.7324, -73.4453], // Farmingdale
      [40.7428, -73.3968], // Pinelawn
      [40.7521, -73.3697], // Wyandanch
      [40.7627, -73.3242], // Deer Park
      [40.7843, -73.2465], // Brentwood
      [40.7845, -73.1990], // Central Islip
      [40.8110, -73.1358], // Ronkonkoma
    ],
  },
  // LIRR Port Jefferson Branch
  {
    id: 'lirr-portjeff',
    name: 'LIRR Port Jefferson Branch',
    system: 'LIRR',
    color: '#0099CC',
    coords: [
      [40.7679, -73.5227], // Hicksville
      [40.8235, -73.5018], // Syosset
      [40.8557, -73.4478], // Cold Spring Harbor
      [40.8693, -73.4259], // Huntington
      [40.8683, -73.3627], // Greenlawn
      [40.8996, -73.3382], // Northport
      [40.8845, -73.2681], // Kings Park
      [40.8598, -73.2066], // Smithtown
      [40.8806, -73.1596], // St. James
      [40.9000, -73.1271], // Stony Brook
      [40.9167, -73.0518], // Port Jefferson Station
      [40.9297, -73.0474], // Port Jefferson
    ],
  },
  // LIRR Port Washington Branch
  {
    id: 'lirr-portwash',
    name: 'LIRR Port Washington Branch',
    system: 'LIRR',
    color: '#6B2C91',
    coords: [
      [40.7506, -73.9934], // Penn Station
      [40.7449, -73.9018], // Woodside
      [40.7611, -73.7596], // Bayside
      [40.7697, -73.7460], // Douglaston
      [40.7730, -73.7319], // Little Neck
      [40.7957, -73.7290], // Great Neck
      [40.8264, -73.6983], // Port Washington
    ],
  },
  // LIRR Babylon / South Shore Branch
  {
    id: 'lirr-babylon',
    name: 'LIRR Babylon Branch',
    system: 'LIRR',
    color: '#009E60',
    coords: [
      [40.7012, -73.8085], // Jamaica
      [40.6645, -73.7067], // Valley Stream
      [40.6558, -73.6745], // Lynbrook
      [40.6595, -73.6394], // Rockville Centre
      [40.6584, -73.6114], // Baldwin
      [40.6565, -73.5828], // Freeport
      [40.6579, -73.5510], // Merrick
      [40.6618, -73.5296], // Bellmore
      [40.6660, -73.5093], // Wantagh
      [40.6673, -73.4871], // Seaford
      [40.6817, -73.4657], // Massapequa
      [40.6817, -73.4538], // Massapequa Park
      [40.6782, -73.4161], // Amityville
      [40.6800, -73.3887], // Copiague
      [40.6854, -73.3726], // Lindenhurst
      [40.7023, -73.3263], // Babylon
    ],
  },
  // LIRR Montauk Branch
  {
    id: 'lirr-montauk',
    name: 'LIRR Montauk Branch',
    system: 'LIRR',
    color: '#EE7623',
    coords: [
      [40.7023, -73.3263], // Babylon
      [40.7237, -73.2460], // Bay Shore
      [40.7293, -73.2103], // Islip
      [40.7203, -73.1690], // Great River
      [40.7411, -73.1279], // Oakdale
      [40.7451, -73.0975], // Sayville
      [40.7648, -73.0159], // Patchogue
      [40.8219, -72.9970], // Medford
      [40.8330, -72.9129], // Yaphank
      [41.0445, -71.9546], // Montauk
    ],
  },
  // LIRR Far Rockaway Branch
  {
    id: 'lirr-rockaway',
    name: 'LIRR Far Rockaway Branch',
    system: 'LIRR',
    color: '#FFCC00',
    coords: [
      [40.6645, -73.7067], // Valley Stream
      [40.6320, -73.7120], // Woodmere
      [40.6224, -73.7443], // Inwood
      [40.6152, -73.7337], // Lawrence
      [40.6070, -73.7540], // Far Rockaway
    ],
  },
  // LIRR Long Beach Branch
  {
    id: 'lirr-longbeach',
    name: 'LIRR Long Beach Branch',
    system: 'LIRR',
    color: '#00A3E0',
    coords: [
      [40.6595, -73.6394], // Rockville Centre
      [40.6386, -73.6657], // East Rockaway
      [40.6339, -73.6428], // Oceanside
      [40.6062, -73.6551], // Island Park
      [40.5887, -73.6577], // Long Beach
    ],
  },
  // LIRR Hempstead Branch
  {
    id: 'lirr-hempstead',
    name: 'LIRR Hempstead Branch',
    system: 'LIRR',
    color: '#DA291C',
    coords: [
      [40.7226, -73.7016], // Floral Park
      [40.7265, -73.6349], // Garden City
      [40.7063, -73.6188], // Hempstead
    ],
  },
  // LIRR West Hempstead Branch
  {
    id: 'lirr-westhempstead',
    name: 'LIRR West Hempstead Branch',
    system: 'LIRR',
    color: '#A2003E',
    coords: [
      [40.6645, -73.7067], // Valley Stream
      [40.6742, -73.6719], // Malverne
      [40.6926, -73.6519], // West Hempstead
    ],
  },
  // LIRR Oyster Bay Branch
  {
    id: 'lirr-oysterbay',
    name: 'LIRR Oyster Bay Branch',
    system: 'LIRR',
    color: '#5C2D82',
    coords: [
      [40.7491, -73.6432], // Mineola
      [40.7479, -73.4823], // Bethpage
      [40.8696, -73.5312], // Oyster Bay
    ],
  },

  // Metro-North Hudson Line
  {
    id: 'mn-hudson',
    name: 'Metro-North Hudson Line',
    system: 'MetroNorth',
    color: '#009B3A',
    coords: [
      [40.7527, -73.9772], // GCT
      [40.8054, -73.9367], // 125th St
      [40.8764, -73.9089], // Marble Hill
      [40.8838, -73.9130], // Spuyten Duyvil
      [40.9040, -73.9140], // Riverdale
      [40.9313, -73.8810], // Yonkers
      [40.9525, -73.8836], // Greystone
      [40.9920, -73.8750], // Hastings
      [41.0095, -73.8743], // Dobbs Ferry
      [41.0390, -73.8680], // Irvington
      [41.0634, -73.8665], // Tarrytown
      [41.0951, -73.8718], // Philipse Manor
      [41.1399, -73.8679], // Scarborough
      [41.1604, -73.8631], // Ossining
      [41.1898, -73.8813], // Croton-Harmon
      [41.2410, -73.9021], // Cortlandt
      [41.2845, -73.9194], // Peekskill
      [41.3820, -73.9378], // Garrison
      [41.4167, -73.9521], // Cold Spring
      [41.5037, -73.9693], // Beacon
      [41.5690, -73.9516], // New Hamburg
      [41.7059, -73.9332], // Poughkeepsie
    ],
  },
  // Metro-North Harlem Line
  {
    id: 'mn-harlem',
    name: 'Metro-North Harlem Line',
    system: 'MetroNorth',
    color: '#7B2D8B',
    coords: [
      [40.7527, -73.9772], // GCT
      [40.8054, -73.9367], // 125th St
      [40.8924, -73.8686], // Woodlawn
      [40.9126, -73.8380], // Mount Vernon West
      [40.9503, -73.8256], // Tuckahoe
      [40.9597, -73.8141], // Crestwood
      [40.9868, -73.7826], // Scarsdale
      [41.0334, -73.7629], // White Plains
      [41.0700, -73.7803], // Valhalla
      [41.1037, -73.7944], // Hawthorne
      [41.1334, -73.7917], // Pleasantville
      [41.1593, -73.7714], // Chappaqua
      [41.2132, -73.6942], // Bedford
      [41.2577, -73.6868], // Katonah
      [41.3035, -73.6783], // Goldens Bridge
      [41.3578, -73.6644], // Croton Falls
      [41.3898, -73.5926], // Purdy's
      [41.4763, -73.5774], // Patterson
      [41.7414, -73.5657], // Dover Plains
      [41.7918, -73.5594], // Wassaic
    ],
  },
  // Metro-North New Haven Line
  {
    id: 'mn-newhaven',
    name: 'Metro-North New Haven Line',
    system: 'MetroNorth',
    color: '#0060A9',
    coords: [
      [40.7527, -73.9772], // GCT
      [40.9090, -73.7745], // New Rochelle
      [40.9261, -73.7531], // Larchmont
      [40.9486, -73.7369], // Mamaroneck
      [40.9692, -73.7146], // Harrison
      [40.9812, -73.6870], // Rye
      [41.0041, -73.6656], // Port Chester
      [41.0220, -73.6285], // Greenwich
      [41.0346, -73.6015], // Cos Cob
      [41.0213, -73.5699], // Old Greenwich
      [41.0468, -73.5422], // Stamford
      [41.0813, -73.5028], // Noroton Heights
      [41.0768, -73.4700], // Darien
      [41.0886, -73.4450], // Rowayton
      [41.0987, -73.4254], // South Norwalk
      [41.1176, -73.3954], // East Norwalk
      [41.1467, -73.3546], // Westport
      [41.1414, -73.2641], // Fairfield
      [41.1772, -73.1853], // Bridgeport
      [41.1981, -73.1316], // Stratford
      [41.2228, -73.0579], // Milford
      [41.2637, -72.9728], // West Haven
      [41.2983, -72.9279], // New Haven
    ],
  },
  // Metro-North New Canaan Branch
  {
    id: 'mn-newcanaan',
    name: 'Metro-North New Canaan Branch',
    system: 'MetroNorth',
    color: '#6CC24A',
    coords: [
      [41.0468, -73.5422], // Stamford
      [41.0706, -73.5289], // Talmadge Hill
      [41.1468, -73.4954], // New Canaan
    ],
  },
  // Metro-North Danbury Branch
  {
    id: 'mn-danbury',
    name: 'Metro-North Danbury Branch',
    system: 'MetroNorth',
    color: '#A1C2E8',
    coords: [
      [41.0987, -73.4254], // South Norwalk
      [41.3953, -73.4572], // Danbury
    ],
  },
  // Metro-North Port Jervis Line
  {
    id: 'mn-portjervis',
    name: 'Metro-North Port Jervis Line',
    system: 'MetroNorth',
    color: '#FF6600',
    coords: [
      [40.7355, -74.0286], // Hoboken
      [40.7614, -74.0748], // Secaucus
      [41.0584, -74.1397], // Ramsey
      [41.1143, -74.1491], // Suffern
      [41.3731, -74.6940], // Port Jervis
    ],
  },
  // Metro-North Pascack Valley Line
  {
    id: 'mn-pascack',
    name: 'Metro-North Pascack Valley Line',
    system: 'MetroNorth',
    color: '#FF9900',
    coords: [
      [40.7355, -74.0286], // Hoboken
      [40.8848, -74.0435], // Hackensack
      [41.1135, -74.0437], // Spring Valley
    ],
  },

  // PATH lines
  {
    id: 'path-nwk-wtc',
    name: 'PATH NWK–WTC',
    system: 'PATH',
    color: '#DA291C',
    coords: [
      [40.7345, -74.1641], // Newark
      [40.7391, -74.1541], // Harrison
      [40.7320, -74.0632], // Journal Square
      [40.7197, -74.0436], // Grove Street
      [40.7165, -74.0340], // Exchange Place
      [40.7127, -74.0134], // WTC
    ],
  },
  {
    id: 'path-hob-wtc',
    name: 'PATH HOB–WTC',
    system: 'PATH',
    color: '#FFD700',
    coords: [
      [40.7355, -74.0286], // Hoboken
      [40.7165, -74.0340], // Exchange Place
      [40.7127, -74.0134], // WTC
    ],
  },
  {
    id: 'path-jsq-33',
    name: 'PATH JSQ–33rd St',
    system: 'PATH',
    color: '#0052A5',
    coords: [
      [40.7320, -74.0632], // Journal Square
      [40.7197, -74.0436], // Grove Street
      [40.7165, -74.0340], // Exchange Place
      [40.7334, -74.0034], // Christopher St
      [40.7345, -74.0038], // 9th St
      [40.7376, -74.0051], // 14th St
      [40.7424, -74.0048], // 23rd St
      [40.7488, -74.0050], // 33rd St
    ],
  },
  {
    id: 'path-hob-33',
    name: 'PATH HOB–33rd St',
    system: 'PATH',
    color: '#009A44',
    coords: [
      [40.7355, -74.0286], // Hoboken
      [40.7334, -74.0034], // Christopher St
      [40.7345, -74.0038], // 9th St
      [40.7376, -74.0051], // 14th St
      [40.7424, -74.0048], // 23rd St
      [40.7488, -74.0050], // 33rd St
    ],
  },
]

export const allMTAStops: MTAStop[] = [...lirrStops, ...metroNorthStops, ...pathStops]

export const SYSTEM_COLORS = {
  LIRR: '#003087',
  MetroNorth: '#7B2D8B',
  PATH: '#DA291C',
}
