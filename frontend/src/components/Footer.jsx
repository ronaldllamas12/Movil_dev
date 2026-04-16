import { useNavigate } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaYoutube } from 'react-icons/fa';
import { MdEmail, MdPhone, MdLocationOn } from 'react-icons/md';

export default function Footer() {
  const navigate = useNavigate();
  return (
    <footer className="w-full bg-[#0f172a] text-white pt-16 pb-8 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Columna 1: Logo e Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-2 rounded-lg font-bold text-sm">MD</div>
              <span className="text-2xl font-bold">Móvil Dev</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Tu tienda de confianza para los mejores celulares del mercado. Calidad garantizada y los mejores precios.
            </p>
            <div className="flex gap-4">
              <FaFacebook className="size-5 text-gray-400 hover:text-white cursor-pointer" />
              <FaTwitter className="size-5 text-gray-400 hover:text-white cursor-pointer" />
              <FaInstagram className="size-5 text-gray-400 hover:text-white cursor-pointer" />
              <FaYoutube className="size-5 text-gray-400 hover:text-white cursor-pointer" />
            </div>
          </div>

          {/* Columna 2: Enlaces Rápidos */}
          <div>
            <h4 className="text-lg font-bold mb-6">Enlaces Rápidos</h4>
            <ul className="space-y-4 text-gray-400 text-sm">
              <li className="hover:text-white cursor-pointer" onClick={() => navigate('/catalogo')}>Catálogo</li>
              <li className="hover:text-white cursor-pointer" onClick={() => navigate('/catalogo/premium')}>Premium</li>
              <li className="hover:text-white cursor-pointer" onClick={() => navigate('/catalogo/gama-media')}>Gama Media</li>
              <li className="hover:text-white cursor-pointer" onClick={() => navigate('/catalogo/economicos')}>Economicos</li>
            </ul>
          </div>

          {/* Columna 3: Atención al Cliente */}
          <div>
            <h4 className="text-lg font-bold mb-6">Atención al Cliente</h4>
            <ul className="space-y-4 text-gray-400 text-sm">
              <li className="hover:text-white cursor-pointer">Centro de Ayuda</li>
              <li className="hover:text-white cursor-pointer">Políticas de Envío</li>
              <li className="hover:text-white cursor-pointer">Devoluciones</li>
              <li className="hover:text-white cursor-pointer">Términos y Condiciones</li>
            </ul>
          </div>

          {/* Columna 4: Contacto */}
          <div>
            <h4 className="text-lg font-bold mb-6">Contacto</h4>
            <ul className="space-y-4 text-gray-400 text-sm">
              <li className="flex items-start gap-3">
                <MdLocationOn className="size-5 text-purple-500 shrink-0" />
                <span>Av. Corrientes 1234, CABA, Buenos Aires, Argentina</span>
              </li>
              <li className="flex items-center gap-3">
                <MdPhone className="size-5 text-purple-500 shrink-0" />
                <span>+54 11 1234-5678</span>
              </li>
              <li className="flex items-center gap-3">
                <MdEmail className="size-5 text-purple-500 shrink-0" />
                <span>info@movildev.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Línea final */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-500 text-xs">
          <p>© 2026 Móvil Dev. Todos los derechos reservados.</p>
          <div className="flex gap-6">
            <span>Privacidad</span>
            <span>Cookies</span>
          </div>
        </div>
      </div>
    </footer>
  );
}