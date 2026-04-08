// ============================================
// SEEDS - Based on Exotic Seed catalog
// ============================================
export const seeds = [
  // FEMINIZADAS
  {
    id: 's001',
    name: 'Black Lemon',
    category: 'feminized',
    type: 'seed',
    genetics: 'Lemon Skunk x Black Domina',
    thc: '25-27%',
    ratio: '50% Indica / 50% Sativa',
    flowering: '8-9 semanas',
    yield: '450-500 g/m2',
    description: 'Hibrido equilibrado con sabor citrico intenso y notas terrosas. Efecto potente y duradero.',
    prices: { 1: 9.50, 3: 24.00, 5: 35.00, 10: 60.00 },
    image: 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?w=400&h=400&fit=crop',
    badge: 'TOP',
    offer: false
  },
  {
    id: 's002',
    name: 'Wedding Monkey',
    category: 'feminized',
    type: 'seed',
    genetics: 'Wedding Cake x Gorilla Glue',
    thc: '28-30%',
    ratio: '60% Indica / 40% Sativa',
    flowering: '9-10 semanas',
    yield: '500-550 g/m2',
    description: 'Bestia de THC con sabor dulce y terroso. Produccion masiva de resina.',
    prices: { 1: 11.00, 3: 28.00, 5: 40.00, 10: 70.00 },
    image: 'https://images.unsplash.com/photo-1616690002178-a37be25da9c3?w=400&h=400&fit=crop',
    badge: 'HOT',
    offer: false
  },
  {
    id: 's003',
    name: 'Exotic Runtz',
    category: 'feminized',
    type: 'seed',
    genetics: 'Zkittlez x Gelato',
    thc: '24-29%',
    ratio: '50% Indica / 50% Sativa',
    flowering: '8-9 semanas',
    yield: '400-450 g/m2',
    description: 'Sabor a caramelo frutal irresistible. Cogollos densos cubiertos de tricomas.',
    prices: { 1: 10.00, 3: 26.00, 5: 38.00, 10: 65.00 },
    image: 'https://images.unsplash.com/photo-1589484344528-39e694981662?w=400&h=400&fit=crop',
    badge: '',
    offer: false
  },
  {
    id: 's004',
    name: 'Malasana Cookies',
    category: 'feminized',
    type: 'seed',
    genetics: 'Girl Scout Cookies x Spanish Landrace',
    thc: '22-25%',
    ratio: '70% Indica / 30% Sativa',
    flowering: '8 semanas',
    yield: '450-500 g/m2',
    description: 'Cookies con raices espanolas. Sabor a galleta con toque a pino mediterraneo.',
    prices: { 1: 9.00, 3: 23.00, 5: 34.00, 10: 58.00 },
    image: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=400&h=400&fit=crop',
    badge: '',
    offer: false
  },
  {
    id: 's005',
    name: 'Penkiller Exclusive',
    category: 'feminized',
    type: 'seed',
    genetics: 'Permanent Marker x Biscotti Pink Champagne',
    thc: '26-30%',
    ratio: '65% Indica / 35% Sativa',
    flowering: '9 semanas',
    yield: '500-550 g/m2',
    description: 'Edicion limitada. Aromas de marcador permanente con fondo floral y champagne.',
    prices: { 5: 45.00 },
    image: 'https://images.unsplash.com/photo-1587754783021-9a675d58707b?w=400&h=400&fit=crop',
    badge: 'LIMITED',
    offer: true,
    oldPrice: 55.00
  },
  {
    id: 's006',
    name: 'Spicy Bitch',
    category: 'feminized',
    type: 'seed',
    genetics: 'Habanero Kush x OG Spice',
    thc: '23-26%',
    ratio: '55% Indica / 45% Sativa',
    flowering: '8-9 semanas',
    yield: '400-450 g/m2',
    description: 'Picante y atrevida. Terpenos unicos con toques de pimienta y especias.',
    prices: { 1: 9.50, 3: 24.00, 5: 36.00, 10: 62.00 },
    image: 'https://images.unsplash.com/photo-1560717789-0ac7c58ac90a?w=400&h=400&fit=crop',
    badge: '',
    offer: false
  },
  {
    id: 's007',
    name: 'Mango Cream',
    category: 'feminized',
    type: 'seed',
    genetics: 'Mango Haze x Cookies & Cream',
    thc: '20-24%',
    ratio: '40% Indica / 60% Sativa',
    flowering: '9-10 semanas',
    yield: '450-500 g/m2',
    description: 'Tropical y cremosa. Sabor a mango maduro con fondo vainillado.',
    prices: { 1: 8.50, 3: 22.00, 5: 33.00, 10: 55.00 },
    image: 'https://images.unsplash.com/photo-1585410636000-6cf37c053085?w=400&h=400&fit=crop',
    badge: 'NEW',
    offer: false
  },
  {
    id: 's008',
    name: 'Georgia Cream',
    category: 'feminized',
    type: 'seed',
    genetics: 'Georgia Pie x Ice Cream Cake',
    thc: '25-28%',
    ratio: '60% Indica / 40% Sativa',
    flowering: '8-9 semanas',
    yield: '450-500 g/m2',
    description: 'Dulce como un postre sureño. Efecto relajante profundo.',
    prices: { 1: 10.00, 3: 26.00, 5: 38.00, 10: 65.00 },
    image: 'https://images.unsplash.com/photo-1601055903647-ddf1ee9e3092?w=400&h=400&fit=crop',
    badge: '',
    offer: false
  },

  // AUTOFLORECIENTES
  {
    id: 's009',
    name: 'Monster Mash Auto',
    category: 'auto',
    type: 'seed',
    genetics: 'Monster Cookies Auto x Mash Up',
    thc: '20-23%',
    ratio: '70% Indica / 30% Sativa',
    flowering: '70-75 dias desde semilla',
    yield: '400-500 g/m2',
    description: 'Autofloreciente XXL monstruosa. Produccion brutal para una auto.',
    prices: { 1: 8.00, 3: 20.00, 5: 30.00, 10: 52.00 },
    image: 'https://images.unsplash.com/photo-1563291589-4e12fd737131?w=400&h=400&fit=crop',
    badge: 'XXL',
    offer: false
  },
  {
    id: 's010',
    name: 'Tangie Smasher Auto',
    category: 'auto',
    type: 'seed',
    genetics: 'Tangie x Auto Smasher',
    thc: '18-22%',
    ratio: '30% Indica / 70% Sativa',
    flowering: '65-70 dias desde semilla',
    yield: '350-400 g/m2',
    description: 'Citricos explosivos en formato auto. Rapida y deliciosa.',
    prices: { 1: 7.50, 3: 19.00, 5: 28.00, 10: 48.00 },
    image: 'https://images.unsplash.com/photo-1567449303183-ae0d6ed1c12e?w=400&h=400&fit=crop',
    badge: '',
    offer: false
  },
  {
    id: 's011',
    name: 'Quick Wash Auto',
    category: 'auto',
    type: 'seed',
    genetics: 'Quick Line x Wash Auto',
    thc: '19-21%',
    ratio: '50% Indica / 50% Sativa',
    flowering: '60-65 dias desde semilla',
    yield: '350-400 g/m2',
    description: 'La mas rapida del catalogo. 60 dias de semilla a cosecha.',
    prices: { 1: 7.00, 3: 18.00, 5: 27.00, 10: 46.00 },
    image: 'https://images.unsplash.com/photo-1536819114556-1e10f967fb61?w=400&h=400&fit=crop',
    badge: 'QUICK',
    offer: true,
    oldPrice: 50.00
  },
  {
    id: 's012',
    name: 'Purple Haze Auto',
    category: 'auto',
    type: 'seed',
    genetics: 'Purple Haze x Ruderalis Elite',
    thc: '17-20%',
    ratio: '35% Indica / 65% Sativa',
    flowering: '70-75 dias desde semilla',
    yield: '350-400 g/m2',
    description: 'Colores purpura espectaculares en formato automatico.',
    prices: { 1: 8.00, 3: 20.00, 5: 30.00, 10: 52.00 },
    image: 'https://images.unsplash.com/photo-1580127645885-9b2bc78f5765?w=400&h=400&fit=crop',
    badge: 'PURPLE',
    offer: false
  },
  {
    id: 's013',
    name: 'Zkittalicious Auto',
    category: 'auto',
    type: 'seed',
    genetics: 'Zkittlez Auto x Delicious',
    thc: '18-22%',
    ratio: '55% Indica / 45% Sativa',
    flowering: '65-70 dias desde semilla',
    yield: '400-450 g/m2',
    description: 'Explosion de sabor a skittles en tu jardín. Dulce y frutal.',
    prices: { 1: 8.50, 3: 21.00, 5: 31.00, 10: 54.00 },
    image: 'https://images.unsplash.com/photo-1602524206684-fdf1389b5e5a?w=400&h=400&fit=crop',
    badge: '',
    offer: false
  },

  // REGULARES
  {
    id: 's014',
    name: 'Exotic Thai Regular',
    category: 'regular',
    type: 'seed',
    genetics: 'Thai Landrace Selection',
    thc: '18-22%',
    ratio: '10% Indica / 90% Sativa',
    flowering: '11-12 semanas',
    yield: '400-500 g/m2',
    description: 'Sativa pura tailandesa. Para los amantes de las sativas clasicas.',
    prices: { 5: 20.00, 10: 35.00 },
    image: 'https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?w=400&h=400&fit=crop',
    badge: 'CLASSIC',
    offer: false
  },
  {
    id: 's015',
    name: 'Death Roll Regular',
    category: 'regular',
    type: 'seed',
    genetics: 'Death Star x Barrel Roll',
    thc: '22-26%',
    ratio: '80% Indica / 20% Sativa',
    flowering: '8-9 semanas',
    yield: '450-500 g/m2',
    description: 'Indica demoledora. Ideal para criadores buscando fenotipos unicos.',
    prices: { 5: 22.00, 10: 38.00 },
    image: 'https://images.unsplash.com/photo-1588686909777-16df0d84d68e?w=400&h=400&fit=crop',
    badge: '',
    offer: false
  },
  {
    id: 's016',
    name: 'Herz OG Regular',
    category: 'regular',
    type: 'seed',
    genetics: 'Heart OG x Unknown Male',
    thc: '20-24%',
    ratio: '70% Indica / 30% Sativa',
    flowering: '9 semanas',
    yield: '400-450 g/m2',
    description: 'OG con corazon aleman. Perfecta para pheno hunting.',
    prices: { 5: 18.00, 10: 32.00 },
    image: 'https://images.unsplash.com/photo-1509149725085-6f09c5454e33?w=400&h=400&fit=crop',
    badge: '',
    offer: true,
    oldPrice: 38.00
  },

  // CBD
  {
    id: 's017',
    name: 'Dr. Greenman Pure CBD',
    category: 'cbd',
    type: 'seed',
    genetics: 'CBD Rich Selection',
    thc: '<1%',
    cbd: '15-20%',
    ratio: '50% Indica / 50% Sativa',
    flowering: '8 semanas',
    yield: '400-450 g/m2',
    description: 'CBD puro sin psicoactividad. Ideal para uso terapeutico.',
    prices: { 1: 7.00, 3: 18.00, 5: 26.00, 10: 45.00 },
    image: 'https://images.unsplash.com/photo-1611070690095-1c1cc1ab8f6f?w=400&h=400&fit=crop',
    badge: 'CBD',
    offer: false
  },
  {
    id: 's018',
    name: 'Exotic Pure CBG',
    category: 'cbd',
    type: 'seed',
    genetics: 'CBG Rich Selection',
    thc: '<0.5%',
    cbd: '12-18% CBG',
    ratio: '40% Indica / 60% Sativa',
    flowering: '9 semanas',
    yield: '350-400 g/m2',
    description: 'Alto contenido en CBG, el cannabinoide madre. Investigacion y bienestar.',
    prices: { 1: 8.00, 3: 20.00, 5: 30.00, 10: 50.00 },
    image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&h=400&fit=crop',
    badge: 'CBG',
    offer: false
  },

  // PACKS MIX
  {
    id: 's019',
    name: 'Pack Sativa Mix',
    category: 'feminized',
    type: 'seed',
    genetics: '5 variedades sativas',
    thc: '20-28%',
    ratio: '100% Sativa Dominantes',
    flowering: 'Variable',
    yield: 'Variable',
    description: 'Pack de 5 semillas de nuestras mejores sativas. Variedad garantizada.',
    prices: { 5: 23.00 },
    image: 'https://images.unsplash.com/photo-1590079168573-63e7f58ce498?w=400&h=400&fit=crop',
    badge: 'PACK',
    offer: true,
    oldPrice: 35.00
  },
  {
    id: 's020',
    name: 'Pack Purple Fem',
    category: 'feminized',
    type: 'seed',
    genetics: '5 variedades purpura',
    thc: '18-26%',
    ratio: 'Variado',
    flowering: 'Variable',
    yield: 'Variable',
    description: 'Coleccion purpura con las geneticas mas coloridas del catalogo.',
    prices: { 5: 25.00 },
    image: 'https://images.unsplash.com/photo-1547517023-7ca0c162f816?w=400&h=400&fit=crop',
    badge: 'PACK',
    offer: false
  }
];

// ============================================
// GROW SHOP - Based on Natural Systems catalog
// ============================================
export const growProducts = [
  // ILUMINACION
  {
    id: 'g001',
    name: 'LED Quantum Board 240W',
    category: 'lighting',
    type: 'grow',
    brand: 'MaxiBright',
    description: 'Panel LED de espectro completo. Eficiencia maxima con bajo consumo. Ideal para espacios de 1.2x1.2m.',
    price: 189.00,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=400&fit=crop',
    badge: 'TOP',
    offer: false
  },
  {
    id: 'g002',
    name: 'LED Quantum Board 480W',
    category: 'lighting',
    type: 'grow',
    brand: 'MaxiBright',
    description: 'Panel LED profesional de alta potencia. Cobertura de 1.5x1.5m. Regulable.',
    price: 329.00,
    image: 'https://images.unsplash.com/photo-1530968464888-bc459fe76d6d?w=400&h=400&fit=crop',
    badge: '',
    offer: false
  },
  {
    id: 'g003',
    name: 'Kit HPS 600W Digital',
    category: 'lighting',
    type: 'grow',
    brand: 'Eluxe',
    description: 'Kit completo de sodio: balastro digital, reflector y bombilla. El clasico que nunca falla.',
    price: 119.00,
    image: 'https://images.unsplash.com/photo-1586953208270-767889fa9261?w=400&h=400&fit=crop',
    badge: '',
    offer: true,
    oldPrice: 149.00
  },
  {
    id: 'g004',
    name: 'Barra LED Suplementaria UV+IR',
    category: 'lighting',
    type: 'grow',
    brand: 'Eluxe',
    description: 'Barra suplementaria UV e infrarrojo para maximizar produccion de resina.',
    price: 79.00,
    image: 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?w=400&h=400&fit=crop',
    badge: 'NEW',
    offer: false
  },

  // FERTILIZANTES
  {
    id: 'g005',
    name: 'Kit Base Flora Trio',
    category: 'fertilizers',
    type: 'grow',
    brand: 'Mills',
    description: 'Kit base de 3 componentes para todo el ciclo. Crecimiento, floracion y engorde.',
    price: 34.00,
    image: 'https://images.unsplash.com/photo-1585314062604-1a357de8b000?w=400&h=400&fit=crop',
    badge: 'BEST',
    offer: false
  },
  {
    id: 'g006',
    name: 'Estimulador de Raices Bio',
    category: 'fertilizers',
    type: 'grow',
    brand: 'Dynomyco',
    description: 'Micorrizas y bacterias beneficas. Raices mas fuertes y sanas desde el primer dia.',
    price: 22.00,
    image: 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=400&h=400&fit=crop',
    badge: 'BIO',
    offer: false
  },
  {
    id: 'g007',
    name: 'PK 13/14 Engorde Floracion',
    category: 'fertilizers',
    type: 'grow',
    brand: 'Mills',
    description: 'Booster de fosforo y potasio para las ultimas semanas de floracion. Cogollos mas densos.',
    price: 18.00,
    image: 'https://images.unsplash.com/photo-1590682680695-43b964a3ae17?w=400&h=400&fit=crop',
    badge: '',
    offer: false
  },
  {
    id: 'g008',
    name: 'Pack Organico Completo',
    category: 'fertilizers',
    type: 'grow',
    brand: 'Meliflor',
    description: 'Todo lo necesario para un cultivo 100% organico. Bio desde semilla a cosecha.',
    price: 55.00,
    image: 'https://images.unsplash.com/photo-1574263867928-4ac19e91a091?w=400&h=400&fit=crop',
    badge: 'BIO',
    offer: true,
    oldPrice: 69.00
  },

  // SUSTRATOS
  {
    id: 'g009',
    name: 'Sustrato Light Mix 50L',
    category: 'substrates',
    type: 'grow',
    brand: 'Meliflor',
    description: 'Sustrato ligero ideal para germinar y esquejes. pH estabilizado.',
    price: 12.00,
    image: 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400&h=400&fit=crop',
    badge: '',
    offer: false
  },
  {
    id: 'g010',
    name: 'Sustrato All Mix 50L',
    category: 'substrates',
    type: 'grow',
    brand: 'Meliflor',
    description: 'Sustrato completo pre-fertilizado. Listo para plantar sin añadir nada mas.',
    price: 15.00,
    image: 'https://images.unsplash.com/photo-1589928796579-7e5e1f22a49b?w=400&h=400&fit=crop',
    badge: 'TOP',
    offer: false
  },
  {
    id: 'g011',
    name: 'Coco Premium 50L',
    category: 'substrates',
    type: 'grow',
    brand: 'Covercrop',
    description: 'Fibra de coco lavada y tamponada. Perfecta para sistemas hidroponicos.',
    price: 14.00,
    image: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400&h=400&fit=crop',
    badge: '',
    offer: false
  },
  {
    id: 'g012',
    name: 'Perlita Expandida 10L',
    category: 'substrates',
    type: 'grow',
    brand: 'Covercrop',
    description: 'Perlita de alta calidad para mezclar con sustrato. Mejora drenaje y aireacion.',
    price: 5.50,
    image: 'https://images.unsplash.com/photo-1597916829826-02e5bb4a54e0?w=400&h=400&fit=crop',
    badge: '',
    offer: false
  },

  // CONTROL CLIMA
  {
    id: 'g013',
    name: 'Extractor TT 150mm',
    category: 'climate',
    type: 'grow',
    brand: 'Natural Systems',
    description: 'Extractor de aire en linea. Silencioso y eficiente. 520 m3/h.',
    price: 45.00,
    image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=400&fit=crop',
    badge: '',
    offer: false
  },
  {
    id: 'g014',
    name: 'Filtro Carbon Activado 150mm',
    category: 'climate',
    type: 'grow',
    brand: 'Natural Systems',
    description: 'Filtro anti-olor de carbon activado. Elimina el 100% de los olores.',
    price: 55.00,
    image: 'https://images.unsplash.com/photo-1581092446327-9b52bd1570c2?w=400&h=400&fit=crop',
    badge: '',
    offer: false
  },
  {
    id: 'g015',
    name: 'Humidificador Ultrasonico 4L',
    category: 'climate',
    type: 'grow',
    brand: 'Natural Systems',
    description: 'Humidificador de niebla fria. Control preciso de humedad en tu armario.',
    price: 35.00,
    image: 'https://images.unsplash.com/photo-1586455122341-96af43eab62a?w=400&h=400&fit=crop',
    badge: '',
    offer: true,
    oldPrice: 42.00
  },
  {
    id: 'g016',
    name: 'Controlador Clima Digital',
    category: 'climate',
    type: 'grow',
    brand: 'Natural Systems',
    description: 'Controlador de temperatura y humedad con pantalla digital. Automatiza tu cultivo.',
    price: 89.00,
    image: 'https://images.unsplash.com/photo-1567789884554-0b844b597180?w=400&h=400&fit=crop',
    badge: 'PRO',
    offer: false
  },

  // CULTIVO
  {
    id: 'g017',
    name: 'Armario Cultivo 120x120x200',
    category: 'cultivation',
    type: 'grow',
    brand: 'Natural Systems',
    description: 'Armario de cultivo interior premium. Tela 600D, reflectante mylar.',
    price: 139.00,
    image: 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400&h=400&fit=crop',
    badge: 'TOP',
    offer: false
  },
  {
    id: 'g018',
    name: 'Macetas Smart Pot 11L (pack 5)',
    category: 'cultivation',
    type: 'grow',
    brand: 'Covercrop',
    description: 'Macetas de tela transpirable. Raices con poda aerea natural.',
    price: 18.00,
    image: 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400&h=400&fit=crop',
    badge: '',
    offer: false
  },

  // MEDICION
  {
    id: 'g019',
    name: 'Medidor pH Digital',
    category: 'measurement',
    type: 'grow',
    brand: 'Natural Systems',
    description: 'Medidor de pH digital de bolsillo. Precision +-0.01. Calibracion automatica.',
    price: 29.00,
    image: 'https://images.unsplash.com/photo-1582719188393-bb71ca45dbb9?w=400&h=400&fit=crop',
    badge: '',
    offer: false
  },
  {
    id: 'g020',
    name: 'Medidor EC/TDS Digital',
    category: 'measurement',
    type: 'grow',
    brand: 'Natural Systems',
    description: 'Medidor de electroconductividad y solidos disueltos. Imprescindible en hidro.',
    price: 25.00,
    image: 'https://images.unsplash.com/photo-1582719188393-bb71ca45dbb9?w=400&h=400&fit=crop',
    badge: '',
    offer: false
  },

  // EXTRACCION
  {
    id: 'g021',
    name: 'Kit Extraccion Rosin Press',
    category: 'extraction',
    type: 'grow',
    brand: 'Natural Systems',
    description: 'Prensa de calor para extraccion sin solventes. Rosin puro y natural.',
    price: 249.00,
    image: 'https://images.unsplash.com/photo-1589484344528-39e694981662?w=400&h=400&fit=crop',
    badge: 'PRO',
    offer: true,
    oldPrice: 299.00
  },
  {
    id: 'g022',
    name: 'Bolsas de Extraccion Ice-O-Lator',
    category: 'extraction',
    type: 'grow',
    brand: 'Natural Systems',
    description: 'Set de 5 bolsas de diferente micronaje para extraccion con hielo y agua.',
    price: 42.00,
    image: 'https://images.unsplash.com/photo-1563291589-4e12fd737131?w=400&h=400&fit=crop',
    badge: '',
    offer: false
  }
];

// All products combined
export const allProducts = [...seeds, ...growProducts];

// Category labels
export const seedCategories = {
  all: 'Todas',
  feminized: 'Feminizadas',
  auto: 'Autoflorecientes',
  regular: 'Regulares',
  cbd: 'CBD'
};

export const growCategories = {
  all: 'Todo',
  lighting: 'Iluminacion',
  fertilizers: 'Fertilizantes',
  substrates: 'Sustratos',
  climate: 'Control Clima',
  cultivation: 'Cultivo',
  measurement: 'Medicion',
  extraction: 'Extraccion'
};
