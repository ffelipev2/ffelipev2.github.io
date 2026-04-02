// Datos estructurados Schema.org - Persona
const personData = {
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Felipe Flores Valdebenito",
  "url": "https://felipeflores.tech/",
  "image": "https://felipeflores.tech/images/felipe-flores-ingeniero.jpg",
  "jobTitle": "Ingeniero Civil Informático | Industria 4.0, IoT y Docencia Universitaria",
  "worksFor": {
    "@type": "Organization",
    "name": "Universidad San Sebastián"
  },
  "alumniOf": "Universidad San Sebastián",
  "description": "Ingeniero Civil Informático y Magíster en Alta Dirección y Gestión de Instituciones Educacionales, con experiencia en Industria 4.0, IoT con ESP32, laboratorios tecnológicos, innovación educativa y fabricación digital.",
  "sameAs": [
    "https://www.linkedin.com/in/felipe-flores-2972b14a/",
    "https://www.facebook.com/arduinoproyectos/",
    "https://github.com/ffelipev2",
    "https://scholar.google.com/scholar?q=Felipe+Flores"
  ]
};

// Inserta dinámicamente el JSON-LD en el <head>
const script = document.createElement('script');
script.type = 'application/ld+json';
script.text = JSON.stringify(personData, null, 2);
document.head.appendChild(script);
