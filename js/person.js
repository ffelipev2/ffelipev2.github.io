// Datos estructurados Schema.org - Persona
const personData = {
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Felipe Flores",
  "url": "https://felipeflores.tech/",
  "image": "https://felipeflores.tech/images/yo.jpg",
  "jobTitle": "Ingeniero Civil Informático",
  "worksFor": {
    "@type": "Organization",
    "name": "Universidad San Sebastián"
  },
  "alumniOf": "Universidad San Sebastián",
  "description": "Ingeniero Civil Informático especializado en IoT, docencia y tecnologías de la Industria 4.0. Creador de proyectos tecnológicos y educativos.",
  "sameAs": [
    "https://www.linkedin.com/in/felipeflores",
    "https://www.facebook.com/arduinoproyectos/",
    "https://scholar.google.com/scholar?q=Felipe+Flores"
  ]
};

// Inserta dinámicamente el JSON-LD en el <head>
const script = document.createElement('script');
script.type = 'application/ld+json';
script.text = JSON.stringify(personData, null, 2);
document.head.appendChild(script);