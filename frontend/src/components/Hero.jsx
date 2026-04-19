import { ChevronLeft, ChevronRight, PlayCircle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const HERO_BACKGROUND_IMAGE = 'https://res.cloudinary.com/dms34zmay/image/upload/v1776571064/evdm53g27rvqtqggb1zn.png';
const SLIDE_DURATION_MS = 7000;

const fallbackSlides = [
  {
    id: 'fallback-iphone',
    type: 'image',
    src: 'https://images.unsplash.com/photo-1678911820864-eed20f1b2263?auto=format&fit=crop&w=1400&q=80',
    alt: 'Celular premium en promoción',
    badge: 'Oferta Flash',
    title: 'Promociones en celulares',
    description: 'Descubre los equipos más vendidos con precio especial por tiempo limitado.',
    ctaPath: '/catalogo',
    ctaText: 'Ver Promociones',
    auraColor: '56, 189, 248',
    auraPosition: '30% 35%',
  },
];

const promotionalVideoSlide = {
  id: 'promo-video',
  type: 'video',
  src: 'https://res.cloudinary.com/dms34zmay/video/upload/v1776572823/jlk2vvnggcjhcexmudjr.mp4',
  poster: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=1400&q=80',
  alt: 'Video promocional de smartphones',
  badge: 'Producto Destacado',
  title: 'Tecnología que sí se siente',
  description: 'Compara diseño, cámara y batería en los modelos destacados de la semana.',
  ctaPath: '/catalogo',
  ctaText: 'Ir al Catálogo',
  auraColor: '167, 139, 250',
  auraPosition: '70% 35%',
};

const promotionalVideoSlideTwo = {
  id: 'promo-video-2',
  type: 'video',
  src: 'https://res.cloudinary.com/dms34zmay/video/upload/v1776573311/mkj2or1uoxwehacpkavw.mp4',
  poster: 'https://images.unsplash.com/photo-1605236453806-6ff36851218e?auto=format&fit=crop&w=1400&q=80',
  alt: 'Segundo video promocional de smartphones',
  badge: 'Video Destacado',
  title: 'Experiencia Inigualable',
  description: 'Conoce detalles de diseño, rendimiento y cámara en este recorrido visual.',
  ctaPath: '/catalogo',
  ctaText: 'Ver Modelos',
  auraColor: '56, 189, 248',
  auraPosition: '30% 30%',
};

const BRAND_AURA_MAP = {
  apple: '100, 212, 191',
  samsung: '100, 189, 248',
  google: '99, 102, 241',
  xiaomi: '251, 146, 60',
  motorola: '300, 140, 248',
  huawei: '244, 114, 182',
};

const DEFAULT_AURA = '100, 189, 248';

function getAuraColorByBrand(brand) {
  if (!brand) {
    return DEFAULT_AURA;
  }

  const normalized = String(brand).toLowerCase().trim();
  return BRAND_AURA_MAP[normalized] || DEFAULT_AURA;
}

export default function Hero({ products = [] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const activeVideoRef = useRef(null);
  const heroSlides = useMemo(() => {
    const productSlides = products
      .filter((product) => Boolean(product?.image) && Boolean(product?.is_featured))
      .slice(0, 3)
      .map((product, index) => ({
        id: `product-${product.id ?? index}`,
        type: 'image',
        src: product.image,
        alt: `${product.nombre || 'Celular'} en promoción`,
        badge: index === 0 ? 'Top Ventas' : 'Promoción',
        title: ` ${product.nombre || 'Celular'}`.trim(),
        description: `Llévalo hoy desde $${product.precio}. Unidades limitadas y envío rápido.`,
        ctaPath: '/catalogo',
        ctaText: 'Ver Detalles',
        auraColor: getAuraColorByBrand(product?.marca),
        auraPosition: index % 2 === 0 ? '28% 36%' : '72% 34%',
      }));

    if (productSlides.length === 0) {
      return [...fallbackSlides, promotionalVideoSlide, promotionalVideoSlideTwo];
    }

    return [...productSlides, promotionalVideoSlide, promotionalVideoSlideTwo];
  }, [products]);

  const totalSlides = heroSlides.length;

  const currentSlide = useMemo(() => heroSlides[activeIndex], [activeIndex]);
  const isCurrentSlideVideo = currentSlide?.type === 'video';

  useEffect(() => {
    if (activeIndex > totalSlides - 1) {
      setActiveIndex(0);
    }
  }, [activeIndex, totalSlides]);

  useEffect(() => {
    if (totalSlides <= 1 || isCurrentSlideVideo) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % totalSlides);
    }, SLIDE_DURATION_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isCurrentSlideVideo, totalSlides]);

  useEffect(() => {
    if (totalSlides <= 1) {
      setProgress(100);
      return undefined;
    }

    if (isCurrentSlideVideo) {
      setProgress(0);
      const video = activeVideoRef.current;
      if (!video) {
        return undefined;
      }

      const updateProgressFromVideo = () => {
        const duration = Number(video.duration || 0);
        if (duration <= 0) {
          setProgress(0);
          return;
        }

        const percentage = (video.currentTime / duration) * 100;
        setProgress(Math.min(100, Math.max(0, percentage)));
      };

      const restartVideo = () => {
        video.currentTime = 0;
        const playPromise = video.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {});
        }
        updateProgressFromVideo();
      };

      video.addEventListener('loadedmetadata', restartVideo);
      video.addEventListener('timeupdate', updateProgressFromVideo);

      if (video.readyState >= 1) {
        restartVideo();
      }

      return () => {
        video.removeEventListener('loadedmetadata', restartVideo);
        video.removeEventListener('timeupdate', updateProgressFromVideo);
      };
    }

    setProgress(0);
    const startedAt = Date.now();
    const progressInterval = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const nextProgress = Math.min(100, (elapsed / SLIDE_DURATION_MS) * 100);
      setProgress(nextProgress);
    }, 80);

    return () => {
      window.clearInterval(progressInterval);
    };
  }, [activeIndex, isCurrentSlideVideo, totalSlides]);

  const goToPrevious = () => {
    setActiveIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToNext = () => {
    setActiveIndex((prev) => (prev + 1) % totalSlides);
  };

  const handleVideoEnded = () => {
    goToNext();
  };

  return (
    <section
      className="relative w-full overflow-hidden px-6 py-12 md:py-16"
      style={{
        backgroundImage: `url(${HERO_BACKGROUND_IMAGE})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-indigo-950/65 to-slate-950/75" />
      <div className="mx-auto grid max-w-[1500px] items-center gap-10 md:grid-cols-2">
        <div className="z-10 text-center md:text-left">
          <span className="inline-flex rounded-full border border-white/40 bg-white/10 px-4 py-1 text-sm font-semibold text-white backdrop-blur-md">
            {currentSlide.badge}
          </span>

          <h1 className="mt-4 text-4xl font-extrabold leading-tight text-white md:text-6xl" style={{ minHeight: '1.25em', height: '2.5em', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
            <span>{currentSlide.title}</span>
          </h1>

          <p className="mt-4 max-w-xl text-lg text-indigo-100 md:text-xl">
            {currentSlide.description}
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
            <Link
              to={currentSlide.ctaPath}
              className="group inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 text-base font-bold text-indigo-700 transition hover:bg-indigo-50"
            >
              {currentSlide.ctaText}
              <ChevronRight className="size-5 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              to="/catalogo"
              className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/5 px-8 py-3 text-base font-semibold text-white transition hover:bg-white/10"
            >
              Ver Catálogo
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-white/10 blur-2xl" />

          <div className="relative aspect-[4/3] md:aspect-[16/11] overflow-hidden rounded-[2rem] border border-white/20 bg-slate-900/60 shadow-2xl">
            {heroSlides.map((slide, index) => (
              <div
                key={slide.id}
                className={`absolute inset-0 [transition:opacity_900ms_ease,transform_1200ms_cubic-bezier(0.22,1,0.36,1),filter_900ms_ease] ${
                  index === activeIndex
                    ? 'opacity-100 translate-y-0 scale-100 blur-0'
                    : 'opacity-0 translate-y-2 scale-[1.02] blur-[2px]'
                }`}
              >
                {slide.type === 'video' ? (
                  <>
                    <video
                      ref={index === activeIndex ? activeVideoRef : undefined}
                      className="h-full w-full object-cover"
                      src={slide.src}
                      poster={slide.poster}
                      muted
                      playsInline
                      autoPlay={index === activeIndex}
                      controls={false}
                      onEnded={handleVideoEnded}
                    />
                    <div className="pointer-events-none absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/40 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                      <PlayCircle className="size-4" /> Video Promocional
                    </div>
                  </>
                ) : (
                  <div className="relative h-full w-full overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-950/35 via-indigo-950/20 to-slate-950/45" />
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `radial-gradient(circle at ${slide.auraPosition || '30% 35%'}, rgba(${slide.auraColor || DEFAULT_AURA}, 0.5) 0%, rgba(${slide.auraColor || DEFAULT_AURA}, 0.18) 28%, rgba(15, 23, 42, 0) 56%)`,
                      }}
                    />
                    <div className="relative flex h-full w-full items-center justify-center p-3 md:p-5">
                      <img
                        src={slide.src}
                        alt={slide.alt}
                        className={`max-h-[95%] w-auto max-w-full rounded-[1.5rem] object-contain drop-shadow-[0_18px_35px_rgba(15,23,42,0.7)] [transition:transform_7000ms_linear] ${
                          index === activeIndex ? 'scale-105 -translate-y-[2px]' : 'scale-100'
                        }`}
                        style={{
                          WebkitMaskImage: 'radial-gradient(ellipse at center, black 72%, transparent 100%)',
                          maskImage: 'radial-gradient(ellipse at center, black 72%, transparent 100%)',
                        }}
                        loading="lazy"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={goToPrevious}
            className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/40 bg-white/10 p-2 text-white shadow-lg backdrop-blur-md transition hover:bg-white/20"
            aria-label="Slide anterior"
          >
            <ChevronLeft className="size-5" />
          </button>

          <button
            type="button"
            onClick={goToNext}
            className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/40 bg-white/10 p-2 text-white shadow-lg backdrop-blur-md transition hover:bg-white/20"
            aria-label="Siguiente slide"
          >
            <ChevronRight className="size-5" />
          </button>

          <div className="mt-4 flex items-center justify-center gap-2">
            {heroSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`relative h-2.5 overflow-hidden rounded-full border border-white/35 transition-all ${
                  index === activeIndex ? 'w-10 bg-white/20' : 'w-3 bg-white/20 hover:bg-white/30'
                }`}
                aria-label={`Ir al slide ${index + 1}`}
              >
                {index === activeIndex ? (
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-white"
                    style={{ width: `${progress}%` }}
                  />
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}