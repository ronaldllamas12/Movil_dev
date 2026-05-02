import { MessageCircle, ShoppingBag } from 'lucide-react'; // Añadimos iconos para que se vea más pro
import { Link } from 'react-router-dom';

export default function ContactBanner() {
  // Configuración de WhatsApp
  const telefono = "573022265668"; // Tu número sin el +
  const mensaje = encodeURIComponent("Hola Móvil Dev! Necesito asesoramiento para elegir un celular.");
  const whatsappUrl = `https://wa.me/${telefono}?text=${mensaje}`;

  return (
    <section className="w-full px-6 py-12">
      <div className="max-w-7xl mx-auto rounded-[3rem] overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 p-12 md:p-20 text-center relative">
        
        {/* Círculos decorativos de fondo */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-900/20 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>

        <div className="relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
            ¿No encuentras lo que buscas?
          </h2>
          <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto mb-10">
            Contáctanos y te ayudaremos a encontrar el celular perfecto para ti. Nuestro equipo está listo para asesorarte.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {/* BOTÓN WHATSAPP */}
            <a 
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-white text-purple-600 px-10 py-4 rounded-2xl font-bold text-lg hover:bg-gray-100 transition shadow-lg"
            >
              <MessageCircle className="size-6" />
              Contactar
            </a>

            {/* BOTÓN CATÁLOGO */}
            <Link 
              to="/catalogo"
              className="flex items-center justify-center gap-2 bg-transparent border-2 border-white text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-white/10 transition"
            >
              <ShoppingBag className="size-6" />
              Explorar Catálogo
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}